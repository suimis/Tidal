import openai

def main():
    client = openai.OpenAI(base_url='http://localhost:11434/v1', api_key='ollama')
    response = client.chat.completions.create(
                    model='deepseek-r1:1.5b',
                    messages=[{'role': 'system', 'content': 'You are a helpful assistant.'},{'role': 'user', 'content': 'Hello!'}],
                    temperature=0.5,
                    stream=True
                )

    # 处理流式响应
    for chunk in response:
        if chunk.choices[0].delta.content is not None:
            print(chunk.choices[0].delta.content, end='', flush=True)
    print()  # 最后打印一个换行

if __name__ == "__main__":
    main()