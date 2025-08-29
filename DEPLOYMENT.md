# UPA-Chatter 生产环境部署指南

本文档介绍如何将 UPA-Chatter 项目的前后端一起编译成生产版本并部署。

## 目录

1. [环境要求](#环境要求)
2. [配置准备](#配置准备)
3. [构建生产版本](#构建生产版本)
4. [启动生产服务](#启动生产服务)
5. [停止生产服务](#停止生产服务)
6. [部署架构建议](#部署架构建议)
7. [常见问题](#常见问题)

## 环境要求

### 系统要求

- **操作系统**: Linux/macOS/Windows
- **Node.js**: >= 18.0.0
- **Python**: >= 3.8
- **pnpm**: >= 8.0.0

### 推荐安装的生产环境工具

```bash
# Python 生产服务器
pip install gunicorn

# 数据库 (推荐使用 PostgreSQL 而不是 SQLite)
pip install psycopg2-binary

# 进程管理工具 (可选)
pip install supervisor
```

## 配置准备

### 1. 创建生产环境配置文件

#### 前端配置

复制模板文件并填入实际值：

```bash
# Linux/macOS
cp frontend/.env.production.template frontend/.env.production

# Windows
copy frontend\.env.production.template frontend\.env.production
```

编辑 `frontend/.env.production` 文件：

```env
PROJECT_ENV=prod
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_WS_URL=wss://your-domain.com/ws
OPENAI_API_KEY=your-openai-api-key-here
DEEPSEEK_API_KEY=your-deepseek-api-key-here
NEXT_PUBLIC_COZE_API_TOKEN=your-coze-api-token-here
NEXT_PUBLIC_COZE_WORKFLOW_ID=your-coze-workflow-id-here
NEXT_PUBLIC_COZE_APP_ID=your-coze-app-id-here
```

#### 后端配置

复制模板文件并填入实际值：

```bash
# Linux/macOS
cp Django/backend/settings_production.py Django/backend/settings_production.py

# Windows
copy Django\backend\settings_production.py Django\backend\settings_production.py
```

编辑 `Django/backend/settings_production.py` 文件：

```python
# 修改以下配置项
SECRET_KEY = 'your-strong-secret-key-here'
ALLOWED_HOSTS = ['your-domain.com', 'www.your-domain.com']

# 配置生产数据库 (推荐 PostgreSQL)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'upa_chatter',
        'USER': 'your-db-user',
        'PASSWORD': 'your-db-password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# 配置 CORS
CORS_ALLOWED_ORIGINS = [
    "https://your-domain.com",
    "https://www.your-domain.com",
]
```

### 2. 设置数据库

#### PostgreSQL 设置示例

```sql
-- 创建数据库
CREATE DATABASE upa_chatter;

-- 创建用户
CREATE USER upa_user WITH PASSWORD 'your-secure-password';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE upa_chatter TO upa_user;

-- 设置时区
ALTER DATABASE upa_chatter SET timezone TO 'Asia/Shanghai';
```

## 构建生产版本

### Linux/macOS

```bash
# 给脚本执行权限
chmod +x build_prod.sh

# 构建生产版本
./build_prod.sh
```

### Windows

```cmd
# 构建生产版本
build_prod.bat
```

### 构建过程说明

构建脚本会自动执行以下步骤：

1. **检查配置文件**: 确保必要的环境配置文件存在
2. **前端构建**:
   - 安装依赖包
   - 构建 Next.js 生产版本
   - 生成优化后的静态资源
3. **后端构建**:
   - 创建必要的目录结构
   - 收集静态文件
   - 运行数据库迁移

构建完成后，会生成以下目录：

- `frontend/.next/` - Next.js 构建输出
- `Django/staticfiles/` - Django 静态文件
- `Django/logs/` - 日志目录

## 启动生产服务

### Linux/macOS

```bash
# 给脚本执行权限
chmod +x start_prod.sh

# 启动生产服务
./start_prod.sh
```

### Windows

```cmd
# 启动生产服务
start_prod.bat
```

### 服务说明

启动后，以下服务将运行：

- **前端服务**: http://localhost:3000
- **后端 API**: http://localhost:8000
- **后端管理**: http://localhost:8000/admin

### 日志文件

- 前端日志: `frontend/logs/nextjs.log`
- 后端日志: `Django/logs/gunicorn.log` (或 `django.log`)
- 访问日志: `Django/logs/access.log`
- 错误日志: `Django/logs/error.log`

## 停止生产服务

### Linux/macOS

```bash
# 给脚本执行权限
chmod +x stop_prod.sh

# 停止生产服务
./stop_prod.sh
```

### Windows

```cmd
# 停止生产服务
stop_prod.bat
```

## 部署架构建议

### 1. 基础架构

```
用户请求 → Nginx (反向代理) → 前端服务 (Next.js)
                          → 后端API (Django + Gunicorn)
```

### 2. Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 配置
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;

    # 前端服务
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态文件
    location /static/ {
        alias /path/to/your/Django/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 媒体文件
    location /media/ {
        alias /path/to/your/Django/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

### 3. 使用 Supervisor 管理进程

创建 Supervisor 配置文件 `/etc/supervisor/conf.d/upa-chatter.conf`:

```ini
[program:upa-chatter-frontend]
command=/usr/bin/pnpm start
directory=/path/to/your/frontend
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/upa-chatter-frontend.log
environment=NODE_ENV=production

[program:upa-chatter-backend]
command=/usr/local/bin/gunicorn --bind 0.0.0.0:8000 backend.wsgi:application --settings=backend.settings_production
directory=/path/to/your/Django
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/upa-chatter-backend.log
```

## 常见问题

### 1. 构建失败

**问题**: 前端构建时出现内存不足错误

```bash
<--- Last few GCs --->
[12345:0x12345678]    12345 ms: Mark-sweep 1234.5 (1234.6) -> 1234.5 (1234.6) MB, 1234.5 / 0.0 ms  allocation failure GC in old space requested
```

**解决方案**:

```bash
# 增加内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
./build_prod.sh
```

### 2. 数据库连接失败

**问题**: 后端启动时无法连接数据库

```
django.db.utils.OperationalError: could not connect to server
```

**解决方案**:

- 检查数据库服务是否运行
- 验证数据库连接配置
- 确保数据库用户权限正确

### 3. 静态文件 404 错误

**问题**: 前端页面加载时静态文件 404

```
GET /static/css/main.css 404 (Not Found)
```

**解决方案**:

```bash
# 重新收集静态文件
cd Django
python manage.py collectstatic --noinput --settings=backend.settings_production
```

### 4. CORS 错误

**问题**: 前端请求后端 API 时出现 CORS 错误

```
Access to XMLHttpRequest at 'http://localhost:8000/api/' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**解决方案**:
检查 `Django/backend/settings_production.py` 中的 `CORS_ALLOWED_ORIGINS` 配置，确保包含前端域名。

### 5. 端口被占用

**问题**: 启动服务时端口被占用

```
Error: listen EADDRINUSE :::3000
```

**解决方案**:

```bash
# Linux/macOS
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## 监控和维护

### 1. 日志监控

```bash
# 实时查看前端日志
tail -f frontend/logs/nextjs.log

# 实时查看后端日志
tail -f Django/logs/gunicorn.log
tail -f Django/logs/error.log
```

### 2. 性能监控

- 使用 `htop` 或 `top` 监控系统资源
- 使用 `nginx -t` 测试 Nginx 配置
- 定期检查磁盘空间和数据库性能

### 3. 备份策略

- 定期备份数据库
- 备份配置文件
- 备份用户上传的媒体文件

## 安全建议

1. **定期更新依赖包**

   ```bash
   # 前端
   pnpm update

   # 后端
   pip list --outdated
   pip install --upgrade package-name
   ```

2. **配置防火墙**

   ```bash
   # 只开放必要端口
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **使用 HTTPS**

   - 配置 SSL 证书
   - 强制 HTTPS 重定向
   - 定期更新证书

4. **监控安全日志**
   - 定期检查访问日志
   - 监控异常请求
   - 设置入侵检测

---

如有问题，请参考项目文档或联系开发团队。
