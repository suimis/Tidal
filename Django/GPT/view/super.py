from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from ..models import Member, Application, Model_info
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def super_login(request):
    """
    超级用户登录接口
    """
    if request.method != 'POST':
        return JsonResponse({
            'status': 'error',
            'message': '请使用POST方法'
        }, status=405)
    
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return JsonResponse({
                'status': 'error',
                'message': '用户名和密码不能为空'
            }, status=400)
        
        user = authenticate(username=username, password=password)
        
        if user is not None and user.is_superuser:
            login(request, user)
            return JsonResponse({
                'status': 'success',
                'message': '超级用户登录成功',
                'user_id': user.id,
                'username': user.username
            })
        else:
            return JsonResponse({
                'status': 'error',
                'message': '用户名或密码错误，或用户不是超级用户'
            }, status=401)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'登录失败: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
def create_user(request):
    """
    创建新用户接口
    请求体格式：
    {
        "username": "用户名",
        "password": "密码",
        "email": "邮箱",
        "department_name": "部门名称",
        "applications": ["应用1", "应用2"]  # 应用名称列表
    }
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
        username = data.get('username')
        password = data.get('password')
        email = data.get('email', '')
        department_name = data.get('department_name')
        application_names = data.get('applications', [])
        
        # 验证必填字段
        if not all([username, password, department_name]):
            return JsonResponse({
                'status': 'error',
                'message': '用户名、密码和部门名称不能为空'
            }, status=400)
        
        # 检查用户名是否已存在
        if Member.objects.filter(username=username).exists():
            return JsonResponse({
                'status': 'error',
                'message': '用户名已存在'
            }, status=400)
        
        # 创建用户
        user = Member.objects.create_user(
            username=username,
            email=email,
            password=password,
            department_name=department_name
        )
        
        # 设置用户可用的应用
        if application_names:
            try:
                applications = Application.objects.filter(name__in=application_names)
                if len(applications) != len(application_names):
                    # 如果有些应用不存在，返回错误
                    found_apps = set(app.name for app in applications)
                    missing_apps = set(application_names) - found_apps
                    return JsonResponse({
                        'status': 'error',
                        'message': f'以下应用不存在: {", ".join(missing_apps)}'
                    }, status=400)
                user.application.set(applications)
            except Exception as e:
                # 如果设置应用时出错，删除已创建的用户
                user.delete()
                return JsonResponse({
                    'status': 'error',
                    'message': f'设置应用失败: {str(e)}'
                }, status=500)
        
        return JsonResponse({
            'status': 'success',
            'message': '用户创建成功',
            'user_id': user.id,
            'username': user.username,
            'department_name': user.department_name,
            'applications': [app.name for app in user.application.all()]
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'创建用户失败: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
def reset_password(request):
    """
    重置用户密码接口
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
        username = data.get('username')
        new_password = data.get('new_password')
        
        if not username or not new_password:
            return JsonResponse({
                'status': 'error',
                'message': '用户名和新密码不能为空'
            }, status=400)
        
        try:
            user = Member.objects.get(username=username)
            user.set_password(new_password)
            user.save()
            return JsonResponse({
                'status': 'success',
                'message': '密码重置成功',
                'username': user.username
            })
        except Member.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': '用户不存在'
            }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'重置密码失败: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
def manage_user_applications(request):
    """
    管理用户应用权限接口
    请求体格式：
    {
        "username": "用户名",
        "action": "add" 或 "remove",
        "applications": ["应用1", "应用2"]  # 要添加或移除的应用列表
    }
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
        username = data.get('username')
        action = data.get('action')
        application_names = data.get('applications', [])
        
        # 验证必填字段
        if not all([username, action, application_names]):
            return JsonResponse({
                'status': 'error',
                'message': '用户名、操作类型和应用列表不能为空'
            }, status=400)
        
        # 验证操作类型
        if action not in ['add', 'remove']:
            return JsonResponse({
                'status': 'error',
                'message': '操作类型必须是 add 或 remove'
            }, status=400)
        
        try:
            # 获取用户
            user = Member.objects.get(username=username)
            
            # 获取应用列表
            applications = Application.objects.filter(name__in=application_names)
            if len(applications) != len(application_names):
                # 如果有些应用不存在，返回错误
                found_apps = set(app.name for app in applications)
                missing_apps = set(application_names) - found_apps
                return JsonResponse({
                    'status': 'error',
                    'message': f'以下应用不存在: {", ".join(missing_apps)}'
                }, status=400)
            
            # 执行添加或移除操作
            if action == 'add':
                # 添加用户到应用的成员列表
                for app in applications:
                    app.member.add(user)
                # 添加应用到用户的权限列表
                user.application.add(*applications)
                message = '应用权限添加成功'
            else:
                # 从应用的成员列表中移除用户
                for app in applications:
                    app.member.remove(user)
                # 从用户的权限列表中移除应用
                user.application.remove(*applications)
                message = '应用权限移除成功'
            
            # 获取用户当前的所有应用
            current_apps = [app.name for app in user.application.all()]
            
            return JsonResponse({
                'status': 'success',
                'message': message,
                'username': user.username,
                'current_applications': current_apps
            })
            
        except Member.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': '用户不存在'
            }, status=404)
            
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'操作失败: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
def get_user_applications(request):
    """
    获取用户应用权限接口
    请求体格式：
    {
        "username": "用户名"
    }
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
        username = data.get('username')
        
        # 验证必填字段
        if not username:
            return JsonResponse({
                'status': 'error',
                'message': '用户名不能为空'
            }, status=400)
        
        try:
            # 获取用户
            user = Member.objects.get(username=username)
            
            # 获取用户的所有应用
            applications = user.application.all()
            
            # 构建应用详细信息列表
            app_list = []
            for app in applications:
                app_info = {
                    'name': app.name,
                    'type': app.type,
                    'icon': app.icon,
                    'api_url': app.api_url
                }
                app_list.append(app_info)
            
            return JsonResponse({
                'status': 'success',
                'message': '获取用户应用权限成功',
                'username': user.username,
                'department_name': user.department_name,
                'applications': app_list,
                'total_applications': len(app_list)
            })
            
        except Member.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': '用户不存在'
            }, status=404)
            
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'获取用户应用权限失败: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
def get_application_users(request):
    """
    获取应用可用用户接口
    请求体格式：
    {
        "application_name": "应用名称"
    }
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
        application_name = data.get('application_name')
        
        # 验证必填字段
        if not application_name:
            return JsonResponse({
                'status': 'error',
                'message': '应用名称不能为空'
            }, status=400)
        
        try:
            # 获取应用
            application = Application.objects.get(name=application_name)
            
            # 获取应用的所有用户
            users = application.member.all()
            
            # 构建用户详细信息列表
            user_list = []
            for user in users:
                user_info = {
                    'username': user.username,
                    'email': user.email,
                    'department_name': user.department_name,
                    'is_active': user.is_active,
                    'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M:%S')
                }
                user_list.append(user_info)
            
            return JsonResponse({
                'status': 'success',
                'message': '获取应用用户列表成功',
                'application': {
                    'name': application.name,
                    'type': application.type,
                    'icon': application.icon,
                    'api_url': application.api_url
                },
                'users': user_list,
                'total_users': len(user_list)
            })
            
        except Application.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': '应用不存在'
            }, status=404)
            
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'获取应用用户列表失败: {str(e)}'
        }, status=500)

@login_required
def get_all_users(request):
    """
    获取所有用户信息接口
    返回所有用户的基本信息，包括用户名、部门等
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
        
        # 获取所有用户
        users = Member.objects.all()
        
        # 构建用户信息列表
        user_list = []
        for user in users:
            user_info = {
                'username': user.username,
                'email': user.email,
                'department_name': user.department_name,
                'is_active': user.is_active,
                'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M:%S'),
                'last_login': user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else None,
                'is_superuser': user.is_superuser
            }
            user_list.append(user_info)
        
        return JsonResponse({
            'status': 'success',
            'message': '获取用户列表成功',
            'users': user_list,
            'total_users': len(user_list)
        })
            
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'获取用户列表失败: {str(e)}'
        }, status=500) 
    
@login_required
@csrf_exempt
def get_model_info(request):
    """
    获取所有模型信息接口
    返回所有模型的基本信息，包括显示名称、模型名称、URL等
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
        
        # 获取所有模型信息
        models = Model_info.objects.all()
        
        # 构建模型信息列表
        model_list = []
        for model in models:
            model_info = {
                'id': model.id,
                'show_name': model.show_name,
                'model_name': model.model_name,
                'model_url': model.model_url,
                'model_key': model.model_key,
                'model_type': model.model_type,
                'model_provider': model.model_provider,
                'model_providerId': model.model_providerId
            }
            model_list.append(model_info)
        
        return JsonResponse({
            'status': 'success',
            'message': '获取模型列表成功',
            'models': model_list,
            'total_models': len(model_list)
        })
            
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'获取模型列表失败: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
def update_user(request):
    """
    更新用户信息接口
    请求体格式：
    {
        "username": "用户名",
        "email": "邮箱",
        "department_name": "部门名称",
        "is_active": true/false,
        "applications": ["应用1", "应用2"]  # 可选，应用名称列表
    }
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
        username = data.get('username')
        
        if not username:
            return JsonResponse({
                'status': 'error',
                'message': '用户名不能为空'
            }, status=400)
        
        try:
            user = Member.objects.get(username=username)
        except Member.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': '用户不存在'
            }, status=404)
        
        # 更新用户信息
        if 'email' in data:
            user.email = data['email']
        if 'department_name' in data:
            user.department_name = data['department_name']
        if 'is_active' in data:
            user.is_active = data['is_active']
        
        user.save()
        
        # 更新用户应用权限
        if 'applications' in data:
            application_names = data['applications']
            if application_names:
                try:
                    applications = Application.objects.filter(name__in=application_names)
                    if len(applications) != len(application_names):
                        found_apps = set(app.name for app in applications)
                        missing_apps = set(application_names) - found_apps
                        return JsonResponse({
                            'status': 'error',
                            'message': f'以下应用不存在: {", ".join(missing_apps)}'
                        }, status=400)
                    user.application.set(applications)
                except Exception as e:
                    return JsonResponse({
                        'status': 'error',
                        'message': f'设置应用失败: {str(e)}'
                    }, status=500)
            else:
                # 清空用户的所有应用权限
                user.application.clear()
        
        return JsonResponse({
            'status': 'success',
            'message': '用户更新成功',
            'user': {
                'username': user.username,
                'email': user.email,
                'department_name': user.department_name,
                'is_active': user.is_active,
                'applications': [app.name for app in user.application.all()]
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'更新用户失败: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
def delete_user(request):
    """
    删除用户接口（软删除，设置为非活跃状态）
    请求体格式：
    {
        "username": "用户名"
    }
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
        username = data.get('username')
        
        if not username:
            return JsonResponse({
                'status': 'error',
                'message': '用户名不能为空'
            }, status=400)
        
        # 防止删除超级用户
        if username == request.user.username:
            return JsonResponse({
                'status': 'error',
                'message': '不能删除当前登录的用户'
            }, status=400)
        
        try:
            user = Member.objects.get(username=username)
            
            # 防止删除其他超级用户
            if user.is_superuser:
                return JsonResponse({
                    'status': 'error',
                    'message': '不能删除超级用户'
                }, status=400)
            
            # 软删除：设置为非活跃状态并清空应用权限
            user.is_active = False
            user.application.clear()
            user.save()
            
            return JsonResponse({
                'status': 'success',
                'message': '用户删除成功',
                'username': user.username
            })
            
        except Member.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': '用户不存在'
            }, status=404)
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'删除用户失败: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
def create_model(request):
    """
    创建新模型接口
    请求体格式：
    {
        "show_name": "显示名称",
        "model_name": "模型名称",
        "model_url": "模型URL",
        "model_key": "模型密钥",
        "model_type": "模型类型",
        "model_provider": "提供商",
        "model_providerId": "提供商ID"
    }
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
        show_name = data.get('show_name')
        model_name = data.get('model_name')
        model_url = data.get('model_url')
        model_key = data.get('model_key')
        model_type = data.get('model_type', '')
        model_provider = data.get('model_provider', '')
        model_providerId = data.get('model_providerId', '')
        
        # 验证必填字段
        if not all([show_name, model_name, model_url]):
            return JsonResponse({
                'status': 'error',
                'message': '显示名称、模型名称和模型URL不能为空'
            }, status=400)
        
        # 检查显示名称是否已存在
        if Model_info.objects.filter(show_name=show_name).exists():
            return JsonResponse({
                'status': 'error',
                'message': '显示名称已存在'
            }, status=400)
        
        # 创建模型
        model = Model_info.objects.create(
            show_name=show_name,
            model_name=model_name,
            model_url=model_url,
            model_key=model_key,
            model_type=model_type,
            model_provider=model_provider,
            model_providerId=model_providerId
        )
        
        return JsonResponse({
            'status': 'success',
            'message': '模型创建成功',
            'model': {
                'id': model.id,
                'show_name': model.show_name,
                'model_name': model.model_name,
                'model_url': model.model_url,
                'model_type': model.model_type,
                'model_provider': model.model_provider,
                'model_providerId': model.model_providerId
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'创建模型失败: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
def update_model(request):
    """
    更新模型接口
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
        model_id = data.get('id')
        
        if not model_id:
            return JsonResponse({
                'status': 'error',
                'message': '模型ID不能为空'
            }, status=400)
        
        try:
            model = Model_info.objects.get(id=model_id)
        except Model_info.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': '模型不存在'
            }, status=404)
        
        # 更新模型信息
        if 'show_name' in data:
            # 检查新的显示名称是否已被其他模型使用
            if data['show_name'] != model.show_name and Model_info.objects.filter(show_name=data['show_name']).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': '显示名称已存在'
                }, status=400)
            model.show_name = data['show_name']
        if 'model_name' in data:
            model.model_name = data['model_name']
        if 'model_url' in data:
            model.model_url = data['model_url']
        if 'model_key' in data:
            model.model_key = data['model_key']
        if 'model_type' in data:
            model.model_type = data['model_type']
        if 'model_provider' in data:
            model.model_provider = data['model_provider']
        if 'model_providerId' in data:
            model.model_providerId = data['model_providerId']
        
        model.save()
        
        return JsonResponse({
            'status': 'success',
            'message': '模型更新成功',
            'model': {
                'id': model.id,
                'show_name': model.show_name,
                'model_name': model.model_name,
                'model_url': model.model_url,
                'model_type': model.model_type,
                'model_provider': model.model_provider,
                'model_providerId': model.model_providerId
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'更新模型失败: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
def delete_model(request):
    """
    删除模型接口
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
        model_id = data.get('id')
        
        if not model_id:
            return JsonResponse({
                'status': 'error',
                'message': '模型ID不能为空'
            }, status=400)
        
        try:
            model = Model_info.objects.get(id=model_id)
            model_name = model.show_name
            model.delete()
            
            return JsonResponse({
                'status': 'success',
                'message': '模型删除成功',
                'model_name': model_name
            })
        except Model_info.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': '模型不存在'
            }, status=404)
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'删除模型失败: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
def get_env_config(request):
    """
    获取环境变量配置接口
    返回前端和后端的环境变量配置
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
        
        import os
        from pathlib import Path
        
        # 获取前端环境变量
        frontend_env = {}
        env_file_path = Path(__file__).resolve().parent.parent.parent.parent / 'frontend' / '.env'
        
        if env_file_path.exists():
            with open(env_file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        # 对敏感信息进行脱敏处理
                        if 'API_KEY' in key or 'TOKEN' in key or 'SECRET' in key:
                            if value and value != '""':
                                frontend_env[key] = value[:4] + '*' * (len(value) - 4) if len(value) > 4 else '*' * len(value)
                            else:
                                frontend_env[key] = value
                        else:
                            frontend_env[key] = value
        
        # 获取后端配置
        backend_config = {
            'DEBUG': str(os.environ.get('DEBUG', '')),
            'SECRET_KEY': os.environ.get('SECRET_KEY', '')[:8] + '*' * 16 if os.environ.get('SECRET_KEY') else '',
            'ALLOWED_HOSTS': os.environ.get('ALLOWED_HOSTS', '').split(',') if os.environ.get('ALLOWED_HOSTS') else [],
            'CORS_ALLOWED_ORIGINS': os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',') if os.environ.get('CORS_ALLOWED_ORIGINS') else [],
        }
        
        return JsonResponse({
            'status': 'success',
            'message': '获取环境变量配置成功',
            'frontend_env': frontend_env,
            'backend_config': backend_config
        })
            
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'获取环境变量配置失败: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
def update_frontend_env(request):
    """
    更新前端环境变量接口
    请求体格式：
    {
        "env_vars": {
            "PROJECT_ENV": "dev",
            "OPENAI_API_KEY": "sk-xxx",
            "DEEPSEEK_API_KEY": "sk-xxx",
            "NEXT_PUBLIC_COZE_API_TOKEN": "pat_xxx",
            "NEXT_PUBLIC_COZE_WORKFLOW_ID": "xxx",
            "NEXT_PUBLIC_COZE_APP_ID": "xxx",
            "NEXT_PUBLIC_COZE_AD_WORKFLOW_ID": "xxx",
            "NEXT_PUBLIC_COZE_AD_APP_ID": "xxx"
        }
    }
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
        env_vars = data.get('env_vars', {})
        
        if not env_vars:
            return JsonResponse({
                'status': 'error',
                'message': '环境变量不能为空'
            }, status=400)
        
        import os
        from pathlib import Path
        import shutil
        from datetime import datetime
        
        env_file_path = Path(__file__).resolve().parent.parent.parent.parent / 'frontend' / '.env'
        
        # 创建备份
        if env_file_path.exists():
            backup_path = env_file_path.with_name(f'.env.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}')
            shutil.copy2(env_file_path, backup_path)
        
        # 写入新的环境变量
        with open(env_file_path, 'w', encoding='utf-8') as f:
            # 写入注释头
            f.write('# 前端环境变量配置文件\n')
            f.write('# 最后更新时间: ' + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + '\n\n')
            
            # 按照特定顺序写入环境变量
            env_order = [
                'PROJECT_ENV',
                'OPENAI_API_KEY',
                'DEEPSEEK_API_KEY',
                'NEXT_PUBLIC_COZE_API_TOKEN',
                'NEXT_PUBLIC_COZE_WORKFLOW_ID',
                'NEXT_PUBLIC_COZE_APP_ID',
                'NEXT_PUBLIC_COZE_AD_WORKFLOW_ID',
                'NEXT_PUBLIC_COZE_AD_APP_ID'
            ]
            
            # 先写入有序的环境变量
            for key in env_order:
                if key in env_vars:
                    f.write(f'{key}={env_vars[key]}\n')
            
            # 写入其他环境变量
            for key, value in env_vars.items():
                if key not in env_order:
                    f.write(f'{key}={value}\n')
        
        return JsonResponse({
            'status': 'success',
            'message': '前端环境变量更新成功',
            'updated_vars': list(env_vars.keys())
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'更新前端环境变量失败: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
def update_backend_env(request):
    """
    更新后端环境变量接口
    请求体格式：
    {
        "config": {
            "DEBUG": "True",
            "SECRET_KEY": "your-secret-key",
            "ALLOWED_HOSTS": ["localhost", "127.0.0.1"],
            "CORS_ALLOWED_ORIGINS": ["http://localhost:3000", "http://127.0.0.1:3000"]
        }
    }
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
        config = data.get('config', {})
        
        if not config:
            return JsonResponse({
                'status': 'error',
                'message': '配置不能为空'
            }, status=400)
        
        import os
        from pathlib import Path
        import shutil
        from datetime import datetime
        
        # 注意：这里只是更新环境变量，实际的后端配置可能需要重启服务器才能生效
        # 更新系统环境变量（临时生效）
        for key, value in config.items():
            if key in ['ALLOWED_HOSTS', 'CORS_ALLOWED_ORIGINS'] and isinstance(value, list):
                os.environ[key] = ','.join(value)
            else:
                os.environ[key] = str(value)
        
        return JsonResponse({
            'status': 'success',
            'message': '后端环境变量更新成功（重启服务器后完全生效）',
            'updated_config': list(config.keys()),
            'note': '部分配置需要重启服务器才能完全生效'
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'更新后端环境变量失败: {str(e)}'
        }, status=500)
