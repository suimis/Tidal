from django.http import StreamingHttpResponse
import requests
import json
from .port_app import PortApp

class DifyWorkflow(PortApp):
    def __init__(self, url: str, api_key: str, data: dict, user: str):
        super().__init__(url, api_key, data, user)
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        self.task_id = None

    def talk(self):
        """
        执行 workflow，支持流式和阻塞模式
        """
        try:
            # 准备请求数据
            payload = {
                "inputs": self.data.get('inputs',{}),
                "response_mode": "streaming",  # 默认使用流式模式
                "user": self.user
            }
            # 发送请求
            response = requests.post(
                f"{self.url}/workflows/run",
                headers=self.headers,
                data=json.dumps(payload),
                stream=True
            )
            response.raise_for_status()
            # 如果是阻塞模式，直接返回完整响应
            if payload["response_mode"] == "blocking":
                return response.json()

            # 流式模式处理
            def generate_stream():
                for line in response.iter_lines():
                    if line:
                        line = line.decode('utf-8')
                        if line.startswith('data: '):
                            data = json.loads(line[6:])  # 去掉 'data: ' 前缀
                            
                            # 保存 task_id 用于停止操作
                            if data.get('task_id'):
                                self.task_id = data['task_id']
                            
                            # 返回 SSE 格式数据
                            yield f"{json.dumps(data)}\n"

            return StreamingHttpResponse(
                generate_stream(),
                content_type='text/event-stream'
            )

        except requests.exceptions.RequestException as e:
            raise ValueError(f"Workflow execution failed: {str(e)}")

    def stop(self):
        """
        停止正在执行的 workflow
        """
        if not self.task_id:
            raise ValueError("No active task to stop")

        try:
            response = requests.post(
                f"{self.url}/workflows/{self.task_id}/stop",
                headers=self.headers,
                json={"user": self.user}
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Failed to stop workflow: {str(e)}")