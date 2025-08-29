#!/bin/bash

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 在新建的 Terminal 窗口中启动前端服务
osascript <<EOF
tell application "Terminal"
  activate
  do script "cd '$SCRIPT_DIR/frontend' && pnpm dev"
end tell
EOF