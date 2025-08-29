from django.urls import path

from .view import login,application,model,super
urlpatterns = [
    path("change_password",login.change_password,name="change_password"),
    path("validate",login.validate,name="validate"),
    path("logout",login.user_logout,name="logout"),
    path("getApps",application.getApps,name="getApps"),
    path("getAllApps",application.getAllApps,name="getAllApps"),
    path("createApp",application.createApp,name="createApp"),
    path("updateApp",application.updateApp,name="updateApp"),
    path("deleteApp",application.deleteApp,name="deleteApp"),
    path("get_application_info",application.get_application_info,name="get_application_info"),
    path("appTalk",application.appTalk,name="appTalk"),
    path("modelTalk",model.modelTalk,name="modelTalk"),
    # 超级用户管理相关路由
    path("get_model_info",super.get_model_info,name="get_model_info"),
    path("super_login",super.super_login,name="super_login"),
    path("create_user",super.create_user,name="create_user"),
    path("update_user",super.update_user,name="update_user"),
    path("delete_user",super.delete_user,name="delete_user"),
    path("reset_password",super.reset_password,name="reset_password"),
    path("manage_user_applications",super.manage_user_applications,name="manage_user_applications"),
    path("get_user_applications",super.get_user_applications,name="get_user_applications"),
    path("get_application_users",super.get_application_users,name="get_application_users"),
    path("get_all_users", super.get_all_users, name="get_all_users"),
    path("create_model",super.create_model,name="create_model"),
    path("update_model",super.update_model,name="update_model"),
    path("delete_model",super.delete_model,name="delete_model"),
    # 环境变量管理相关路由
    path("get_env_config",super.get_env_config,name="get_env_config"),
    path("update_frontend_env",super.update_frontend_env,name="update_frontend_env"),
    path("update_backend_env",super.update_backend_env,name="update_backend_env"),
]
