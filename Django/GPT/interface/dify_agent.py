from django.http import HttpResponse,JsonResponse,StreamingHttpResponse
from django.contrib.auth import authenticate
from django.middleware.csrf import get_token
from django.contrib.auth.decorators import login_required
import re
import requests
import json
from django.views.decorators.csrf import csrf_exempt,csrf_protect
from django.core.exceptions import ObjectDoesNotExist
from .port_app import PortApp

class DifyAgent(PortApp):
    def __init__(self, url: str, api_key: str, data: dict, user: str):
        super().__init__(url, api_key, data, user)
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def talk(self):
        try:
            print(self.data)
            if "query" not in self.data:
                raise ValueError("query is required in data")
            info = {
                "inputs":self.data.get('inputs',{}),
                "query":self.data.get('query',''),
                "response_mode":'streaming',
                "conversation_id":self.data.get('conversation_id',""),
                "user":self.user,
                "files":self.data.get('files',[])
            }
            response = requests.post(
                f"{self.url}/chat-messages",
                data=json.dumps(info),
                headers=self.headers,
                stream=True
            )
            response.raise_for_status()
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
            raise ValueError(f"Agent execution failed: {str(e)}")

    def stop(self):
        if "task_id" not in self.data:
            raise ValueError("task_id is required in data")
        
        response = requests.post(
            f"{self.url}/chat-messages/{self.data['task_id']}/stop",
            json={"user": self.user},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()