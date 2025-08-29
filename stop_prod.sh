#!/bin/bash

# UPA-Chatter 生产环境停止脚本
# 用于停止前端和后端的生产服务

set -e

echo "🛑 停止 UPA-Chatter 生产环境..."

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/Django"

# 查找并停止 Next.js 进程
stop_frontend() {
    echo "🎨 停止前端服务..."
    
    # 查找 Next.js 进程
    FRONTEND_PIDS=$(ps aux | grep "pnpm start" | grep -v grep | awk '{print $2}' || true)
    
    if [ -z "$FRONTEND_PIDS" ]; then
        echo "ℹ️  未找到运行中的前端服务"
    else
        echo "🔍 找到前端进程: $FRONTEND_PIDS"
        
        for PID in $FRONTEND_PIDS; do
            kill -15 $PID 2>/dev/null || true
            echo "✅ 已发送停止信号给前端进程 (PID: $PID)"
        done
        
        # 等待进程优雅退出
        sleep 2
        
        # 检查是否还有残留进程
        REMAINING_PIDS=$(ps aux | grep "pnpm start" | grep -v grep | awk '{print $2}' || true)
        if [ ! -z "$REMAINING_PIDS" ]; then
            echo "⚠️  强制停止残留进程: $REMAINING_PIDS"
            for PID in $REMAINING_PIDS; do
                kill -9 $PID 2>/dev/null || true
            done
        fi
        
        echo "✅ 前端服务已停止"
    fi
}

# 查找并停止 Django/Gunicorn 进程
stop_backend() {
    echo "🔧 停止后端服务..."
    
    # 查找 Gunicorn 进程
    GUNICORN_PIDS=$(ps aux | grep "gunicorn" | grep -v grep | awk '{print $2}' || true)
    
    if [ ! -z "$GUNICORN_PIDS" ]; then
        echo "🔍 找到 Gunicorn 进程: $GUNICORN_PIDS"
        
        for PID in $GUNICORN_PIDS; do
            kill -15 $PID 2>/dev/null || true
            echo "✅ 已发送停止信号给 Gunicorn 进程 (PID: $PID)"
        done
    fi
    
    # 查找 Django 开发服务器进程
    DJANGO_PIDS=$(ps aux | grep "python manage.py runserver" | grep -v grep | awk '{print $2}' || true)
    
    if [ ! -z "$DJANGO_PIDS" ]; then
        echo "🔍 找到 Django 进程: $DJANGO_PIDS"
        
        for PID in $DJANGO_PIDS; do
            kill -15 $PID 2>/dev/null || true
            echo "✅ 已发送停止信号给 Django 进程 (PID: $PID)"
        done
    fi
    
    if [ -z "$GUNICORN_PIDS" ] && [ -z "$DJANGO_PIDS" ]; then
        echo "ℹ️  未找到运行中的后端服务"
    else
        # 等待进程优雅退出
        sleep 2
        
        # 检查是否还有残留进程
        REMAINING_GUNICORN=$(ps aux | grep "gunicorn" | grep -v grep | awk '{print $2}' || true)
        REMAINING_DJANGO=$(ps aux | grep "python manage.py runserver" | grep -v grep | awk '{print $2}' || true)
        
        if [ ! -z "$REMAINING_GUNICORN" ]; then
            echo "⚠️  强制停止残留 Gunicorn 进程: $REMAINING_GUNICORN"
            for PID in $REMAINING_GUNICORN; do
                kill -9 $PID 2>/dev/null || true
            done
        fi
        
        if [ ! -z "$REMAINING_DJANGO" ]; then
            echo "⚠️  强制停止残留 Django 进程: $REMAINING_DJANGO"
            for PID in $REMAINING_DJANGO; do
                kill -9 $PID 2>/dev/null || true
            done
        fi
        
        echo "✅ 后端服务已停止"
    fi
}

# 清理 PID 文件（如果有）
cleanup_pid_files() {
    echo "🧹 清理 PID 文件..."
    
    # 清理可能的 PID 文件
    if [ -f "$FRONTEND_DIR/.next/pids" ]; then
        rm -f "$FRONTEND_DIR/.next/pids" 2>/dev/null || true
    fi
    
    if [ -f "$BACKEND_DIR/gunicorn.pid" ]; then
        rm -f "$BACKEND_DIR/gunicorn.pid" 2>/dev/null || true
    fi
    
    echo "✅ PID 文件清理完成"
}

# 显示停止状态
show_status() {
    echo ""
    echo "📊 停止状态"
    echo "================================="
    
    # 检查前端服务
    FRONTEND_CHECK=$(ps aux | grep "pnpm start" | grep -v grep || true)
    if [ -z "$FRONTEND_CHECK" ]; then
        echo "✅ 前端服务已停止"
    else
        echo "❌ 前端服务仍在运行:"
        echo "$FRONTEND_CHECK"
    fi
    
    # 检查后端服务
    BACKEND_CHECK=$(ps aux | grep -E "(gunicorn|python manage.py runserver)" | grep -v grep || true)
    if [ -z "$BACKEND_CHECK" ]; then
        echo "✅ 后端服务已停止"
    else
        echo "❌ 后端服务仍在运行:"
        echo "$BACKEND_CHECK"
    fi
    
    echo ""
}

# 主函数
main() {
    echo "🎯 UPA-Chatter 生产环境停止"
    echo "================================="
    
    stop_frontend
    stop_backend
    cleanup_pid_files
    show_status
    
    echo "🎉 服务停止完成！"
    echo ""
    echo "💡 提示："
    echo "- 运行 ./start_prod.sh 重新启动服务"
    echo "- 运行 ./build_prod.sh 重新构建服务"
    echo ""
}

# 运行主函数
main
