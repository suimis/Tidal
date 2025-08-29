from django.http import JsonResponse, StreamingHttpResponse
from django.contrib.auth import authenticate, login, logout
import re
import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from ..models import Member,Application,Model_info
from django.core.exceptions import ObjectDoesNotExist
from ..interface.dify_agent import DifyAgent
from ..interface.dify_workflow import DifyWorkflow
from ..interface.model_chat import ModelChat

def login_check(view_func):
    def wrapper(request, *args, **kwargs):
        if request.user.is_authenticated:
            return view_func(request, *args, **kwargs)
        else:
            return StreamingHttpResponse({'message': '未登录，请先登录', 'status': 'error'}, status=401)
    return wrapper

@csrf_exempt
def validate(request):
    if request.method == 'POST':
        # 获取用户输入的账户名和密码
        username = request.POST.get('username')
        password = request.POST.get('password')

        # 验证用户
        user = authenticate(username=username, password=password)
        
        if user is not None:
            # 验证成功
            login(request,user)
            return JsonResponse({
                'message': '登录成功', 
                'status': 'success',
                'user':{'first_name':user.first_name,
                'last_name':user.last_name,
                'department_name':user.department_name,
                'email':user.email,
                'is_superuser':user.is_superuser}
            })
        else:
            # 验证失败
            return JsonResponse({
                'message': '用户名或密码错误', 
                'status': 'error'
            })
    return JsonResponse({
        'message': '仅支持 POST 请求', 
        'status': 'error'
    })

@csrf_exempt
def user_logout(request):
    if request.method == 'POST':
        logout(request)
        return JsonResponse({'message': '登出成功', 'status': 'success'})
    return JsonResponse({'message': '仅支持POST请求', 'status': 'error'})

##账号注册模块
@csrf_exempt
def change_password(request):
    if request.method == 'POST':
        try:
            data = request.POST.dict()
            # 密码强度验证正则表达式
            pattern = r'^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$'
            username = data.get('username')
            old_password = data.get('old_password')
            new_password = data.get('new_password')

            # 验证新密码格式
            if not re.match(pattern, new_password):
                return JsonResponse({"message": "新密码格式不对，密码必须包含字母、数字和特殊字符", "status": "error"}, status=400)
            if old_password == new_password:
                return JsonResponse({"message": "新密码不能与旧密码相同", "status": "error"}, status=400)
            user = authenticate(username=username, password=old_password)
            if user is not None:
                # 更新用户密码
                user.set_password(new_password)
                user.save()
                return JsonResponse({'message': "密码修改成功", "status": "success"}, status=200)
            else:
                return JsonResponse({"message": "用户名或旧密码错误", "status": "error"}, status=400)
        except Exception as e:
            return JsonResponse({"message": f"发生未知错误: {str(e)}", "status": "error"}, status=500)
    else:
        return JsonResponse({"message": "只支持 POST 请求", "status": "error"}, status=405)
