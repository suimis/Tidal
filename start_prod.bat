
@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM UPA-Chatter 生产环境启动脚本 (Windows版本)
REM 用于启动前端和后端的生产服务

echo 🚀 启动 UPA-Chatter 生产环境...

REM 获取脚本所在目录
set SCRIPT_DIR=%~dp0
set FRONTEND_DIR=%SCRIPT_DIR%frontend
set BACKEND_DIR=%SCRIPT_DIR%Django

REM 检查是否已构建
:check_build
echo 📋 检查构建状态...

if not exist "%FRONTEND_DIR%\.next" (
    echo ❌ 错误：前端未构建，请先运行 build_prod.bat
    pause
    exit /b 1
)

if not exist "%BACKEND_DIR%\staticfiles" (
    echo ❌ 错误：后端未构建，请先运行 build_prod.bat
    pause
    exit /b 1
)

echo ✅ 构建检查通过
goto :eof

REM 启动后端服务
:start_backend
echo 🔧 启动后端服务...
cd /d "%BACKEND_DIR%"

REM 创建日志目录
if not exist "logs" mkdir logs

REM 检查是否有 Gunicorn
where gunicorn >nul 2>&1
if %errorlevel% equ 0 (
    echo 🌐 使用 Gunicorn 启动 Django...
    start "Django Backend" cmd /c "gunicorn --bind 0.0.0.0:8000 backend.wsgi:application --settings=backend.settings_production --workers 4 --timeout 120 --access-logfile logs/access.log --error-logfile logs/error.log > logs/gunicorn.log 2>&1"
    echo ✅ 后端服务已启动 - 端口: 8000
) else (
    echo ⚠️  Gunicorn 未安装，使用 Django 开发服务器启动...
    echo 💡 建议安装 Gunicorn: pip install gunicorn
    start "Django Backend" cmd /c "python manage.py runserver 0.0.0.0:8000 --settings=backend.settings_production > logs/django.log 2>&1"
    echo ✅ 后端服务已启动 - 端口: 8000
)
goto :eof

REM 启动前端服务
:start_frontend
echo 🎨 启动前端服务...
cd /d "%FRONTEND_DIR%"

REM 创建日志目录
if not exist "logs" mkdir logs

REM 启动 Next.js 生产服务器
start "Frontend" cmd /c "pnpm start > logs/nextjs.log 2>&1"
echo ✅ 前端服务已启动 - 端口: 3000
goto :eof

REM 显示服务状态
:show_status
echo.
echo 📊 服务状态
echo =================================
echo 前端服务: http://localhost:3000
echo 后端API:  http://localhost:8000
echo 后端管理: http://localhost:8000/admin
echo.
echo 📝 日志文件
echo 前端日志: %FRONTEND_DIR%\logs\nextjs.log
echo 后端日志: %BACKEND_DIR%\logs\gunicorn.log (或 django.log)
echo 访问日志: %BACKEND_DIR%\logs\access.log
echo 错误日志: %BACKEND_DIR%\logs\error.log
echo.
echo 🛑 停止服务
echo 运行: stop_prod.bat
echo.
goto :eof

REM 主函数
:main
echo 🎯 UPA-Chatter 生产环境启动
echo =================================

call :check_build
if errorlevel 1 goto :error

call :start_backend
if errorlevel 1 goto :error

call :start_frontend
if errorlevel 1 goto :error

call :show_status

echo 🎉 服务启动完成！
echo.
echo 💡 提示：
echo - 新的命令行窗口已启动用于运行服务
echo - 运行 stop_prod.bat 停止服务
echo.
goto :end

:error
echo ❌ 启动过程中出现错误
pause
exit /b 1

:end
pause
exit /b 0