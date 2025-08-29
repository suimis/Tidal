@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM UPA-Chatter 生产环境停止脚本 (Windows版本)
REM 用于停止前端和后端的生产服务

echo 🛑 停止 UPA-Chatter 生产环境...

REM 停止前端服务
:stop_frontend
echo 🎨 停止前端服务...

REM 查找并停止 Next.js 进程
tasklist /FI "WINDOWTITLE eq Frontend*" /FO TABLE | find "cmd.exe" >nul
if %errorlevel% equ 0 (
    echo 🔍 找到前端服务进程
    taskkill /FI "WINDOWTITLE eq Frontend*" /F >nul 2>&1
    echo ✅ 前端服务已停止
) else (
    echo ℹ️  未找到运行中的前端服务
)

REM 查找并停止 pnpm start 进程
tasklist /FI "IMAGENAME eq pnpm.exe" /FO TABLE | find "pnpm.exe" >nul
if %errorlevel% equ 0 (
    echo 🔍 找到 pnpm 进程
    taskkill /FI "IMAGENAME eq pnpm.exe" /F >nul 2>&1
    echo ✅ pnpm 进程已停止
)

REM 查找并停止 node.exe 进程（Next.js）
tasklist /FI "IMAGENAME eq node.exe" /FO TABLE | find "node.exe" >nul
if %errorlevel% equ 0 (
    echo 🔍 找到 Node.js 进程
    taskkill /FI "IMAGENAME eq node.exe" /F >nul 2>&1
    echo ✅ Node.js 进程已停止
)
goto :eof

REM 停止后端服务
:stop_backend
echo 🔧 停止后端服务...

REM 查找并停止 Django Backend 进程
tasklist /FI "WINDOWTITLE eq Django Backend*" /FO TABLE | find "cmd.exe" >nul
if %errorlevel% equ 0 (
    echo 🔍 找到后端服务进程
    taskkill /FI "WINDOWTITLE eq Django Backend*" /F >nul 2>&1
    echo ✅ 后端服务已停止
) else (
    echo ℹ️  未找到运行中的后端服务
)

REM 查找并停止 Gunicorn 进程
tasklist /FI "IMAGENAME eq gunicorn.exe" /FO TABLE | find "gunicorn.exe" >nul
if %errorlevel% equ 0 (
    echo 🔍 找到 Gunicorn 进程
    taskkill /FI "IMAGENAME eq gunicorn.exe" /F >nul 2>&1
    echo ✅ Gunicorn 进程已停止
)

REM 查找并停止 Python 进程
tasklist /FI "IMAGENAME eq python.exe" /FO TABLE | find "python.exe" >nul
if %errorlevel% equ 0 (
    echo 🔍 找到 Python 进程
    taskkill /FI "IMAGENAME eq python.exe" /F >nul 2>&1
    echo ✅ Python 进程已停止
)
goto :eof

REM 清理 PID 文件
:cleanup_pid_files
echo 🧹 清理 PID 文件...

REM 清理可能的 PID 文件
if exist "%FRONTEND_DIR%\.next\pids" (
    del /f /q "%FRONTEND_DIR%\.next\pids" >nul 2>&1
)

if exist "%BACKEND_DIR%\gunicorn.pid" (
    del /f /q "%BACKEND_DIR%\gunicorn.pid" >nul 2>&1
)

echo ✅ PID 文件清理完成
goto :eof

REM 显示停止状态
:show_status
echo.
echo 📊 停止状态
echo =================================

REM 检查前端服务
tasklist /FI "IMAGENAME eq pnpm.exe" /FO TABLE | find "pnpm.exe" >nul
if %errorlevel% equ 0 (
    echo ❌ 前端服务仍在运行
    tasklist /FI "IMAGENAME eq pnpm.exe" /FO TABLE
) else (
    echo ✅ 前端服务已停止
)

tasklist /FI "IMAGENAME eq node.exe" /FO TABLE | find "node.exe" >nul
if %errorlevel% equ 0 (
    echo ❌ Node.js 进程仍在运行
    tasklist /FI "IMAGENAME eq node.exe" /FO TABLE
)

REM 检查后端服务
tasklist /FI "IMAGENAME eq gunicorn.exe" /FO TABLE | find "gunicorn.exe" >nul
if %errorlevel% equ 0 (
    echo ❌ Gunicorn 服务仍在运行
    tasklist /FI "IMAGENAME eq gunicorn.exe" /FO TABLE
) else (
    echo ✅ Gunicorn 服务已停止
)

tasklist /FI "IMAGENAME eq python.exe" /FO TABLE | find "python.exe" >nul
if %errorlevel% equ 0 (
    echo ❌ Python 服务仍在运行
    tasklist /FI "IMAGENAME eq python.exe" /FO TABLE
) else (
    echo ✅ Python 服务已停止
)

echo.
goto :eof

REM 主函数
:main
echo 🎯 UPA-Chatter 生产环境停止
echo =================================

call :stop_frontend
call :stop_backend
call :cleanup_pid_files
call :show_status

echo 🎉 服务停止完成！
echo.
echo 💡 提示：
echo - 运行 start_prod.bat 重新启动服务
echo - 运行 build_prod.bat 重新构建服务
echo.

pause
exit /b 0
