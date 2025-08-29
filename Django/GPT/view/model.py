from django.http import StreamingHttpResponse, JsonResponse
from ..models import Model_info
import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from ..interface.model_chat import ModelChat
from .login import login_check

@csrf_exempt
@login_check
@require_http_methods(['POST'])
def modelTalk(request):
    try:
        data = request.POST.dict()
        required_fields = ['name', 'data', 'command']
        for field in required_fields:
            if field not in data:
                return StreamingHttpResponse(
                    [json.dumps({
                        "status": "error",
                        "message": f"Missing required field: {field}"
                    })],
                    content_type='text/event-stream',
                    status=400
                )
        if data['command'] == 'talk':
            try:
                model_info = Model_info.objects.get(show_name=data['name'])
            except Model_info.DoesNotExist:
                return StreamingHttpResponse(
                    [json.dumps({
                        "status": "error",
                        "message": "Model not found"
                    })],
                    content_type='text/event-stream',
                    status=404
                )
            agent = ModelChat(
                model_name=model_info.model_name,
                url=model_info.model_url,
                api_key=model_info.model_key,
                data=json.loads(data.get('data')),
                user=request.user.username
            )
            response = agent.talk()
            return response  # 直接返回agent.talk()的结果，因为它已经是StreamingHttpResponse
        elif data['command'] == 'stop':
            return StreamingHttpResponse(
                [json.dumps({
                    "status": "success",
                    "message": "Stop command received"
                })],
                content_type='text/event-stream',
                status=200
            )
        else:
            return StreamingHttpResponse(
                [json.dumps({
                    "status": "error",
                    "message": "Invalid command"
                })],
                content_type='text/event-stream',
                status=400
            )
    except Exception as e:
        return StreamingHttpResponse(
            [json.dumps({
                "status": "error",
                "message": f"An error occurred: {str(e)}"
            })],
            content_type='text/event-stream',
            status=500
        )
