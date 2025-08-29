from django.http import StreamingHttpResponse
import openai
import json
import ast
import time
from .port_app import PortApp

class ModelChat(PortApp):
    def __init__(self,model_name: str, url: str, api_key: str, data: dict, user: str):
        super().__init__(url, api_key, data, user)
        # 设置 OpenAI API key
        self.model_name = model_name
        self.client = openai.OpenAI(base_url=self.url, api_key=self.api_key)
    def talk(self):
        """
        直接调用 OpenAI API 进行对话
        """
        try:
            # 准备请求数据
            messages = self.data.get("messages", "[]")
            temperature = self.data.get("temperature", 0.7)
            if not messages or len(messages) == 0:
                return StreamingHttpResponse(
                    [json.dumps({
                        "status": "error",
                        "message": "Missing required field: messages"
                    })],
                    content_type='text/event-stream',
                    status=400
                )
            print(self.model_name)
            # 发送请求
            def generate_stream():
                try:
                    response = self.client.chat.completions.create(
                        model=self.model_name,
                        messages=messages,
                        temperature=temperature,
                        stream=True
                    )
                    completion_id = f"chatcmpl-{int(time.time())}"
                    for chunk in response:
                        if chunk.choices[0].delta.content is not None:
                            content = chunk.choices[0].delta.content
                            # 构造 OpenAI 兼容的 NDJSON 响应
                            chunk_data = {
                                "id": completion_id,
                                "object": "chat.completion.chunk",
                                "created": int(time.time()),
                                "model": self.model_name,
                                "choices": [
                                    {
                                        "index": 0,
                                        "delta": {"content": content},
                                        "finish_reason": None
                                    }
                                ]
                            }
                            yield f"data: {json.dumps(chunk_data)}\n\n"
                except Exception as stream_error:
                    error_msg = json.dumps({
                        "status": "error",
                        "message": f"Stream Error: {str(stream_error)}"
                    })
                    yield f"data: {error_msg}\n\n"
            return StreamingHttpResponse(
                generate_stream(),
                content_type='text/event-stream'
            )

        except openai.APIError as api_error:
            error_response = json.dumps({
                "status": "error",
                "message": f"API Error: {str(api_error)}"
            })
            return StreamingHttpResponse(
                [f"data: {error_response}\n\n"],
                content_type='text/event-stream',
                status=500
            )
        except Exception as e:
            error_response = json.dumps({
                "status": "error",
                "message": f"Model chat failed: {str(e)}"
            })
            return StreamingHttpResponse(
                [f"data: {error_response}\n\n"],
                content_type='text/event-stream',
                status=500
            )

    def stop(self):
        """
        停止当前对话（对于 OpenAI API，实际上不需要停止操作）
        """
        return {"status": "success", "message": "Chat stopped"} 