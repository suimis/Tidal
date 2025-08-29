from django.http import JsonResponse, StreamingHttpResponse
from ..models import Application
import json
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from ..interface.dify_agent import DifyAgent
from ..interface.dify_workflow import DifyWorkflow
from .login import login_check
import requests

@csrf_protect
def getApps(request):
    if request.method == 'GET':
        try:
            # 直接使用已登录用户的信息
            user = request.user
            
            # 获取用户关联的应用
            applications = user.application.all()
            
            # 构建应用列表，包含更多信息
            application_list = []
            for app in applications:
                app_info = {
                    "name": app.name,
                    "type": app.type,
                    "icon": app.icon
                }
                application_list.append(app_info)
                
            return JsonResponse({
                "applications": application_list, 
                "status": "success"
            }, status=200)
        except Exception as e:
            return JsonResponse({
                "message": f"获取应用列表失败: {str(e)}", 
                "status": "error"
            }, status=500)
    return JsonResponse({
        "message": "仅支持 GET 请求", 
        "status": "error"
    }, status=405)

@csrf_exempt
@login_required
def getAllApps(request):
    """
    获取所有应用列表接口（管理员专用）
    """
    if request.method != 'GET':
        return JsonResponse({
            'status': 'error',
            'message': '请使用GET方法'
        }, status=405)
    
    try:
        # 验证当前用户是否为超级用户
        if not request.user.is_superuser:
            return JsonResponse({
                'status': 'error',
                'message': '需要超级用户权限'
            }, status=403)
        
        # 获取所有应用
        applications = Application.objects.all()
        
        # 构建应用列表
        application_list = []
        for app in applications:
            app_info = {
                'name': app.name,
                'api_url': app.api_url,
                'type': app.type,
                'icon': app.icon,
                'member_count': app.member.count()
            }
            application_list.append(app_info)
        
        return JsonResponse({
            'status': 'success',
            'message': '获取应用列表成功',
            'applications': application_list,
            'total_applications': len(application_list)
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'获取应用列表失败: {str(e)}'
        }, status=500)

@login_check
@csrf_protect
def get_application_info(request):
    if request.method == 'GET':
        try:
            data = request.GET.dict()
            print(data)
            # 验证必要参数
            if 'application_name' not in data:
                return JsonResponse({
                    "status": "error", 
                    "message": "缺少应用名称参数"
                }, status=400)
            # 验证用户是否有权限访问该应用
            if not request.user.application.filter(name=data['application_name']).exists():
                return JsonResponse({
                    "status": "error",
                    "message": "您没有权限访问该应用"
                }, status=403)

            # 获取应用信息
            try:
                application = Application.objects.get(name=data['application_name'])
            except Application.DoesNotExist:
                return JsonResponse({
                    "status": "error",
                    "message": "未找到该应用"
                }, status=404)

            # 创建请求头
            headers = {
                "Authorization": f"Bearer {application.api_key}",
                "Content-Type": "application/json"
            }
            print({application.api_url})
            print(application.api_key)
            # 获取基本信息
            info_response = requests.get(
                f"{application.api_url}/parameters",
                headers=headers
            )
            info_response.raise_for_status()
            info_data = info_response.json()

            # 获取参数信息
            params_response = requests.get(
                f"{application.api_url}/parameters", 
                headers=headers
            )
            params_response.raise_for_status()
            params_data = params_response.json()
            for key,value in info_data.items():
                params_data[key] = value
            
            # 整合返回数据
            return JsonResponse({
                "status": "success",
                "data": params_data
            })

        except requests.exceptions.RequestException as e:
            return JsonResponse({
                "status": "error",
                "message": f"API请求失败: {str(e)}"
            }, status=500)
        except Exception as e:
            return JsonResponse({
                "status": "error", 
                "message": f"发生未知错误: {str(e)}"
            }, status=500)
    else:
        return JsonResponse({
            "status": "error",
            "message": "仅支持GET请求"
        }, status=405)

@csrf_exempt
@login_check
@require_http_methods(['POST'])
def appTalk(request):
    try:
        data = request.POST.dict()
        # 验证必要参数
        required_fields = ['application_name', 'data', 'command']
        for field in required_fields:
            if field not in data:
                return StreamingHttpResponse([{
                    "status": "error",
                    "message": f"Missing required field: {field}"
                }], status=400)
        
        # 获取应用信息
        try:
            application = Application.objects.get(name=data['application_name'])
        except Application.DoesNotExist:
            return StreamingHttpResponse([{
                "status": "error",
                "message": "Application not found"
            }], status=404)
        
        # 根据应用类型创建相应的代理实例
        if application.type == "dify_agent":
            agent = DifyAgent(
                url=application.api_url,
                api_key=application.api_key,
                data=json.loads(data.get('data')),
                user=request.user.username
            )
        elif application.type == "dify_workflow":
            agent = DifyWorkflow(
                url=application.api_url,
                api_key=application.api_key,
                data=json.loads(data.get('data')),
                user=request.user.username
            )
        else:
            return StreamingHttpResponse([{
                "status": "error",
                "message": "Unsupported application type"
            }], status=400)
        # 根据命令执行相应操作
        if data['command'] == 'talk':
            response = agent.talk()
            return response
        elif data['command'] == 'stop':
            response = agent.stop()
            return response
        else:
            return StreamingHttpResponse([{
                "status": "error",
                "message": "Invalid command"
            }], status=400)
    except Exception as e:
        return StreamingHttpResponse([{
            "status": "error",
            "message": f"An error occurred: {str(e)}"
        }], status=500)

@csrf_exempt
@login_required
def createApp(request):
    """
    创建新应用接口
    """
    if request.method != 'POST':
        return JsonResponse({
            'status': 'error',
            'message': '请使用POST方法'
        }, status=405)
    
    try:
        # 验证当前用户是否为超级用户
        if not request.user.is_superuser:
            return JsonResponse({
                'status': 'error',
                'message': '需要超级用户权限'
            }, status=403)
        
        data = json.loads(request.body)
        name = data.get('name')
        api_url = data.get('api_url')
        api_key = data.get('api_key')
        app_type = data.get('type')
        icon = data.get('icon', 'MessageSquare')
        
        # 验证必填字段
        if not all([name, api_url, api_key, app_type]):
            return JsonResponse({
                'status': 'error',
                'message': '应用名称、API URL、API Key和类型不能为空'
            }, status=400)
        
        # 检查应用名称是否已存在
        if Application.objects.filter(name=name).exists():
            return JsonResponse({
                'status': 'error',
                'message': '应用名称已存在'
            }, status=400)
        
        # 创建应用
        application = Application.objects.create(
            name=name,
            api_url=api_url,
            api_key=api_key,
            type=app_type,
            icon=icon
        )
        
        return JsonResponse({
            'status': 'success',
            'message': '应用创建成功',
            'application': {
                'name': application.name,
                'type': application.type,
                'icon': application.icon,
                'api_url': application.api_url
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'创建应用失败: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
def updateApp(request):
    """
    更新应用接口
    """
    if request.method != 'PUT':
        return JsonResponse({
            'status': 'error',
            'message': '请使用PUT方法'
        }, status=405)
    
    try:
        # 验证当前用户是否为超级用户
        if not request.user.is_superuser:
            return JsonResponse({
                'status': 'error',
                'message': '需要超级用户权限'
            }, status=403)
        
        data = json.loads(request.body)
        name = data.get('name')
        
        if not name:
            return JsonResponse({
                'status': 'error',
                'message': '应用名称不能为空'
            }, status=400)
        
        try:
            application = Application.objects.get(name=name)
        except Application.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': '应用不存在'
            }, status=404)
        
        # 更新应用信息
        if 'api_url' in data:
            application.api_url = data['api_url']
        if 'api_key' in data:
            application.api_key = data['api_key']
        if 'type' in data:
            application.type = data['type']
        if 'icon' in data:
            application.icon = data['icon']
        
        application.save()
        
        return JsonResponse({
            'status': 'success',
            'message': '应用更新成功',
            'application': {
                'name': application.name,
                'type': application.type,
                'icon': application.icon,
                'api_url': application.api_url
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'更新应用失败: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
def deleteApp(request):
    """
    删除应用接口
    """
    if request.method != 'DELETE':
        return JsonResponse({
            'status': 'error',
            'message': '请使用DELETE方法'
        }, status=405)
    
    try:
        # 验证当前用户是否为超级用户
        if not request.user.is_superuser:
            return JsonResponse({
                'status': 'error',
                'message': '需要超级用户权限'
            }, status=403)
        
        data = json.loads(request.body)
        name = data.get('name')
        
        if not name:
            return JsonResponse({
                'status': 'error',
                'message': '应用名称不能为空'
            }, status=400)
        
        try:
            application = Application.objects.get(name=name)
            application.delete()
            
            return JsonResponse({
                'status': 'success',
                'message': '应用删除成功'
            })
        except Application.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': '应用不存在'
            }, status=404)
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'删除应用失败: {str(e)}'
        }, status=500)
