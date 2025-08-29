@echo off

:: 脚本所在目录
set SCRIPT_DIR=%~dp0

:: 在一个新的CMD窗口中启动前端服务
start cmd /k "cd /d %SCRIPT_DIR%\frontend && npm run dev"

:: 在一个新的CMD窗口中启动后端服务
start cmd /k "cd /d %SCRIPT_DIR%\Django && python manage.py runserver"