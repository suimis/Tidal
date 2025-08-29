
#!/bin/bash

# UPA-Chatter 生产环境启动脚本
# 用于启动前端和后端的生产服务

set -e

echo "🚀 启动 UPA-Chatter 生产环境..."

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/Django"

# 检查是否已构建
check_build() {
    echo "📋 检查构建状态..."
    
    if [ ! -d "$FRONTEND_DIR/.next" ]; then
        echo "❌ 错误：前端未构建，请先运行 ./build_prod.sh"
        exit 1
    fi
    
    if [ ! -d "$BACKEND_DIR/staticfiles" ]; then
        echo "❌ 错误：后端未构建，请先运行 ./build_prod.sh"
        exit 1
    fi
    
    echo "✅ 构建检查通过"
}

# 启动后端服务
start_backend() {
    echo "🔧 启动后端服务..."
    cd "$BACKEND_DIR"
    
    # 使用 Gunicorn 启动 Django（推荐）
    if command -v gunicorn &> /dev/null; then
        echo "🌐 使用 Gunicorn 启动 Django..."
        # 设置 DJANGO_SETTINGS_MODULE 环境变量来指定配置文件
        export DJANGO_SETTINGS_MODULE=backend.settings_production
        nohup gunicorn --bind 0.0.0.0:8000 backend.wsgi:application \
            --workers 4 \
            --timeout 120 \
            --access-logfile logs/access.log \
            --error-logfile logs/error.log \
            > logs/gunicorn.log 2>&1 &
        BACKEND_PID=$!
        echo "✅ 后端服务已启动 (PID: $BACKEND_PID) - 端口: 8000"
    else
        echo "⚠️  Gunicorn 未安装，使用 Django 开发服务器启动..."
        echo "💡 建议安装 Gunicorn: pip install gunicorn"
        nohup python manage.py runserver 0.0.0.0:8000 \
            --settings=backend.settings_production \
            > logs/django.log 2>&1 &
        BACKEND_PID=$!
        echo "✅ 后端服务已启动 (PID: $BACKEND_PID) - 端口: 8000"
    fi
}

# 启动前端服务
start_frontend() {
    echo "🎨 启动前端服务..."
    cd "$FRONTEND_DIR"
    
    # 确保日志目录存在
    mkdir -p logs
    
    # 启动 Next.js 生产服务器
    nohup pnpm start > logs/nextjs.log 2>&1 &
    FRONTEND_PID=$!
    echo "✅ 前端服务已启动 (PID: $FRONTEND_PID) - 端口: 3000"
}

# 显示服务状态
show_status() {
    echo ""
    echo "📊 服务状态"
    echo "================================="
    echo "前端服务: http://localhost:3000"
    echo "后端API:  http://localhost:8000"
    echo "后端管理: http://localhost:8000/admin"
    echo ""
    echo "📋 进程信息"
    echo "前端PID: $FRONTEND_PID"
    echo "后端PID: $BACKEND_PID"
    echo ""
    echo "📝 日志文件"
    echo "前端日志: $FRONTEND_DIR/logs/nextjs.log"
    echo "后端日志: $BACKEND_DIR/logs/gunicorn.log (或 django.log)"
    echo "访问日志: $BACKEND_DIR/logs/access.log"
    echo "错误日志: $BACKEND_DIR/logs/error.log"
    echo ""
    echo "🛑 停止服务"
    echo "运行: ./stop_prod.sh"
    echo ""
}

# 清理函数
cleanup() {
    echo ""
    echo "🧹 清理进程..."
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo "前端服务已停止"
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "后端服务已停止"
    fi
    
    echo "✅ 清理完成"
}

# 主函数
main() {
    echo "🎯 UPA-Chatter 生产环境启动"
    echo "================================="
    
    check_build
    start_backend
    start_frontend
    show_status
    
    echo "🎉 服务启动完成！"
    echo ""
    echo "💡 提示："
    echo "- 按 Ctrl+C 停止所有服务"
    echo "- 或者运行 ./stop_prod.sh 停止服务"
    echo ""
    
    # 等待用户中断
    wait
}

# 设置退出时执行的清理函数
trap cleanup EXIT INT TERM

# 运行主函数
main