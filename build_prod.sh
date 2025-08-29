
#!/bin/bash

# UPA-Chatter 生产环境构建脚本
# 用于构建前端和后端的生产版本

set -e  # 遇到错误立即退出

echo "🚀 开始构建 UPA-Chatter 生产环境..."

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/Django"

# 检查必要文件是否存在
check_files() {
    echo "📋 检查必要文件..."
    
    if [ ! -f "$FRONTEND_DIR/.env.production" ]; then
        echo "❌ 错误：前端生产环境配置文件不存在"
        echo "请复制 $FRONTEND_DIR/.env.production.template 为 $FRONTEND_DIR/.env.production 并填入实际值"
        exit 1
    fi
    
    if [ ! -f "$BACKEND_DIR/backend/settings_production.py" ]; then
        echo "❌ 错误：Django生产环境配置文件不存在"
        echo "请复制 $BACKEND_DIR/backend/settings_production.py.template 为 $BACKEND_DIR/backend/settings_production.py 并填入实际值"
        exit 1
    fi
    
    echo "✅ 所有必要文件存在"
}

# 构建前端
build_frontend() {
    echo "🎨 开始构建前端..."
    cd "$FRONTEND_DIR"
    
    # 安装依赖
    echo "📦 安装前端依赖..."
    pnpm install
    
    # 构建生产版本
    echo "🔨 构建前端生产版本..."
    NODE_ENV=production pnpm build
    
    echo "✅ 前端构建完成"
}

# 构建后端
build_backend() {
    echo "🔧 开始构建后端..."
    cd "$BACKEND_DIR"
    
    # 创建必要的目录
    mkdir -p logs media
    
    # 收集静态文件
    echo "📁 收集静态文件..."
    python manage.py collectstatic --noinput --settings=backend.settings_production
    
    # 运行数据库迁移
    echo "🗄️ 运行数据库迁移..."
    python manage.py migrate --settings=backend.settings_production
    
    echo "✅ 后端构建完成"
}

# 清理函数
cleanup() {
    echo "🧹 清理临时文件..."
    # 可以在这里添加清理逻辑
}

# 主函数
main() {
    echo "🎯 UPA-Chatter 生产环境构建"
    echo "================================="
    
    check_files
    build_frontend
    build_backend
    
    echo "================================="
    echo "🎉 构建完成！"
    echo ""
    echo "📋 后续步骤："
    echo "1. 配置您的域名和SSL证书"
    echo "2. 设置生产数据库"
    echo "3. 配置反向代理（Nginx/Apache）"
    echo "4. 运行 start_prod.sh 启动生产服务"
    echo ""
}

# 设置退出时执行的清理函数
trap cleanup EXIT

# 运行主函数
main