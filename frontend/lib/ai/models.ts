interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const DEFAULT_CHAT_MODEL: string = 'deepseek_r1';

export const chatModels: Array<ChatModel> = [
  {
    id: 'deepseek_r1',
    name: 'Deepseek R1',
    description: 'Deepseek R1',
  },
  {
    id: 'deepseek_chat',
    name: 'Deepseek Chat',
    description: 'Deepseek Chat',
  },
];
