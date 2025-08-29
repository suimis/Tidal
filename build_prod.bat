
@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM UPA-Chatter 生产环境构建脚本 (Windows版本)
REM 用于构建前端和后端的生产版本

echo 🚀 开始构建 UPA-Chatter 生产环境...

REM 获取脚本所在目录
set SCRIPT_DIR=%~dp0
set FRONTEND_DIR=%SCRIPT_DIR%frontend
set BACKEND_DIR=%SCRIPT_DIR%Django

REM 检查必要文件是否存在
:check_files
echo 📋 检查必要文件...

if not exist "%FRONTEND_DIR%\.env.production" (
    echo ❌ 错误：前端生产环境配置文件不存在
    echo 请复制 %FRONTEND_DIR%\.env.production.template 为 %FRONTEND_DIR%\.env.production 并填入实际值
    pause
    exit /b 1
)

if not exist "%BACKEND_DIR%\backend\settings_production.py" (
    echo ❌ 错误：Django生产环境配置文件不存在
    echo 请复制 %BACKEND_DIR%\backend\settings_production.py.template 为 %BACKEND_DIR%\backend\settings_production.py 并填入实际值
    pause
    exit /b 1
)

echo ✅ 所有必要文件存在
goto :eof

REM 构建前端
:build_frontend
echo 🎨 开始构建前端...
cd /d "%FRONTEND_DIR%"

REM 安装依赖
echo 📦 安装前端依赖...
call pnpm install
if errorlevel 1 (
    echo ❌ 前端依赖安装失败
    pause
    exit /b 1
)

REM 构建生产版本
echo 🔨 构建前端生产版本...
set NODE_ENV=production
call pnpm build
if errorlevel 1 (
    echo ❌ 前端构建失败
    pause
    exit /b 1
)

echo ✅ 前端构建完成
goto :eof

REM 构建后端
:build_backend
echo 🔧 开始构建后端...
cd /d "%BACKEND_DIR%"

REM 创建必要的目录
if not exist "logs" mkdir logs
if not exist "media" mkdir media

REM 收集静态文件
echo 📁 收集静态文件...
python manage.py collectstatic --noinput --settings=backend.settings_production
if errorlevel 1 (
    echo ❌ 静态文件收集失败
    pause
    exit /b 1
)

REM 运行数据库迁移
echo 🗄️ 运行数据库迁移...
python manage.py migrate --settings=backend.settings_production
if errorlevel 1 (
    echo ❌ 数据库迁移失败
    pause
    exit /b 1
)

echo ✅ 后端构建完成
goto :eof

REM 主函数
:main
echo 🎯 UPA-Chatter 生产环境构建
echo =================================

call :check_files
if errorlevel 1 goto :error

call :build_frontend
if errorlevel 1 goto :error

call :build_backend
if errorlevel 1 goto :error

echo =================================
echo 🎉 构建完成！
echo.
echo 📋 后续步骤：
echo 1. 配置您的域名和SSL证书
echo 2. 设置生产数据库
echo 3. 配置反向代理（Nginx/Apache）
echo 4. 运行 start_prod.bat 启动生产服务
echo.
goto :end

:error
echo ❌ 构建过程中出现错误
pause
exit /b 1

:end
pause
exit /b 0