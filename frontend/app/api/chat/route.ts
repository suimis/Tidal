import { getWeather } from '@/lib/ai/tools/get-weather';
import { Model } from '@/lib/types/models';
import { isProviderEnabled } from '@/lib/utils/registry';
import { deepseek } from '@ai-sdk/deepseek';
import { createDataStreamResponse, smoothStream, streamText } from 'ai';
import { cookies } from 'next/headers';
import { Planner } from '@/lib/agent/planner';

export const maxDuration = 30;

const DEFAULT_MODEL: Model = {
  id: 'deepseek-r1',
  name: 'Deepseek R1',
  provider: 'deepseek',
  providerId: 'deepseek',
  enabled: true,
  toolCallType: 'native',
  planMode: false,
};

export async function POST(req: Request) {
  try {
    const { messages, experimental_attachments } = await req.json();

    console.log('[API Debug] Received attachments:', experimental_attachments);

    const cookieStore = await cookies();
    const modelJson = cookieStore.get('selectedModel')?.value;
    const mode = cookieStore.get('mode')?.value;

    let selectedModel = DEFAULT_MODEL;

    if (modelJson) {
      try {
        selectedModel = JSON.parse(modelJson) as Model;
      } catch (e) {
        console.error('Failed to parse selected model:', e);
      }
    }

    if (
      !isProviderEnabled(selectedModel.providerId) ||
      selectedModel.enabled === false
    ) {
      return new Response(
        `Selected provider is not enabled ${selectedModel.providerId}`,
        {
          status: 404,
          statusText: 'Not Found',
        }
      );
    }

    const modelId = `${selectedModel.providerId}:${selectedModel.id}`;

    console.log(modelId);

    const modelDict: Record<string, unknown> = {
      'deepseek:deepseek-reasoner': deepseek('deepseek-reasoner'),
      'deepseek:deepseek-chat': deepseek('deepseek-chat'),
      'deepseek:deepseek-r1': deepseek('deepseek-reasoner'), // 添加 deepseek-r1 映射
    };

    // 处理附件并提取文本内容
    const processedMessages = [...messages];
    if (experimental_attachments && experimental_attachments.length > 0) {
      console.log('[API Debug] Processing attachments...');

      // 提取文本内容
      const textContents: string[] = [];

      for (const attachment of experimental_attachments) {
        try {
          if (
            attachment.contentType?.startsWith('text/') ||
            attachment.contentType === 'application/json' ||
            attachment.name?.endsWith('.txt') ||
            attachment.name?.endsWith('.md') ||
            attachment.name?.endsWith('.json') ||
            attachment.name?.endsWith('.csv')
          ) {
            // 从Data URL提取Base64内容
            if (attachment.url?.startsWith('data:')) {
              const base64Data = attachment.url.split(',')[1];
              const textContent = Buffer.from(base64Data, 'base64').toString(
                'utf-8'
              );
              textContents.push(`文件 "${attachment.name}":\n${textContent}`);
              console.log('[API Debug] Extracted text from:', attachment.name);
            }
          }
        } catch (error) {
          console.error(
            '[API Debug] Error processing attachment:',
            attachment.name,
            error
          );
        }
      }

      // 将文本内容添加到最后一条用户消息
      if (textContents.length > 0 && processedMessages.length > 0) {
        const lastMessage = processedMessages[processedMessages.length - 1];
        if (lastMessage.role === 'user') {
          lastMessage.content += '\n\n附件内容:\n' + textContents.join('\n\n');
          console.log('[API Debug] Added attachment content to message');
        }
      }
    }

    return createDataStreamResponse({
      execute: (dataStream) => {
        let result;

        // 检查是否是计划执行请求
        const lastMessage = processedMessages[processedMessages.length - 1];
        const isExecutionRequest =
          lastMessage?.content?.includes('请执行以下计划：');

        // 检查是否是第一条消息（只有第一条消息才生成计划）
        const isFirstMessage = processedMessages.length <= 1;

        // 如果是计划模式、是第一条消息、且不是执行请求，使用 Planner 生成计划
        if (mode === 'plan' && isFirstMessage && !isExecutionRequest) {
          result = streamText(
            Planner({
              messages: processedMessages,
              model: modelId,
              searchMode: false,
            })
          );
        } else {
          // 常规模式或计划执行请求
          result = streamText({
            model:
              (modelDict[modelId] as Parameters<
                typeof streamText
              >[0]['model']) || deepseek('deepseek-chat'),
            messages: processedMessages,
            experimental_transform: smoothStream({ chunking: 'word' }),
            tools: {
              getWeather,
            },
          });
        }

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return '发生了一些错误!';
      },
    });
  } catch (error) {
    console.error('API route error:', error);
    return new Response('Error processing your request', {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
