'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from '@/lib/utils/cookies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Save,
  Settings,
  Globe,
  Server,
  Search,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { ButtonLoading } from '@/components/ui/loading-spinner';

interface EnvConfig {
  frontend_env: Record<string, string>;
  backend_config: Record<string, unknown>;
}

export default function SystemSettingsPage() {
  const [envConfig, setEnvConfig] = useState<EnvConfig>({
    frontend_env: {},
    backend_config: {},
  });
  const [loading, setLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBackendDialog, setShowBackendDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    'frontend' | 'backend'
  >('frontend');
  const [editingData, setEditingData] = useState<Record<string, any>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {}
  );
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // 检查管理员权限
  useEffect(() => {
    const userCookie = getCookie('user');
    if (userCookie) {
      try {
        const loginUser = JSON.parse(userCookie);
        if (!loginUser.is_superuser) {
          toast.error('需要管理员权限');
          router.push('/chat');
          return;
        }
      } catch {
        toast.error('用户信息解析失败');
        router.push('/chat');
        return;
      }
    } else {
      toast.error('请先登录');
      router.push('/login');
      return;
    }
  }, [router]);

  // 获取环境变量配置
  const fetchEnvConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/GPT/get_env_config', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        setEnvConfig(data);
        // 初始化密码显示状态
        const passwordStates: Record<string, boolean> = {};
        Object.keys(data.frontend_env).forEach((key) => {
          if (
            key.includes('API_KEY') ||
            key.includes('TOKEN') ||
            key.includes('SECRET')
          ) {
            passwordStates[key] = false;
          }
        });
        setShowPasswords(passwordStates);
      } else {
        throw new Error(data.message || '获取环境变量配置失败');
      }
    } catch (error) {
      console.error('获取环境变量配置失败:', error);
      toast.error('获取环境变量配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 打开前端环境变量编辑对话框
  const openFrontendEditDialog = () => {
    setEditingCategory('frontend');
    setEditingData({ ...envConfig.frontend_env });
    setShowEditDialog(true);
  };

  // 打开后端配置编辑对话框
  const openBackendEditDialog = () => {
    setEditingCategory('backend');
    setEditingData({ ...envConfig.backend_config });
    setShowBackendDialog(true);
  };

  // 保存前端环境变量
  const saveFrontendEnv = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        'http://localhost:8000/GPT/update_frontend_env',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') || '',
          },
          body: JSON.stringify({ env_vars: editingData }),
        }
      );

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('前端环境变量更新成功');
        setShowEditDialog(false);
        fetchEnvConfig(); // 刷新配置
      } else {
        throw new Error(data.message || '更新前端环境变量失败');
      }
    } catch (error) {
      console.error('更新前端环境变量失败:', error);
      toast.error('更新前端环境变量失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存后端配置
  const saveBackendEnv = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        'http://localhost:8000/GPT/update_backend_env',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') || '',
          },
          body: JSON.stringify({ config: editingData }),
        }
      );

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('后端配置更新成功');
        setShowBackendDialog(false);
        fetchEnvConfig(); // 刷新配置
      } else {
        throw new Error(data.message || '更新后端配置失败');
      }
    } catch (error) {
      console.error('更新后端配置失败:', error);
      toast.error('更新后端配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 切换密码显示状态
  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 过滤环境变量
  const filterEnvVars = (
    envVars: Record<string, string>,
    searchTerm: string
  ) => {
    if (!searchTerm) return envVars;
    return Object.fromEntries(
      Object.entries(envVars).filter(
        ([key, value]) =>
          key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  useEffect(() => {
    fetchEnvConfig();
  }, []);

  // 环境变量分类
  const frontendCategories = {
    基础设置: ['PROJECT_ENV'],
    AI模型配置: ['OPENAI_API_KEY', 'DEEPSEEK_API_KEY'],
    Coze集成配置: [
      'NEXT_PUBLIC_COZE_API_TOKEN',
      'NEXT_PUBLIC_COZE_WORKFLOW_ID',
      'NEXT_PUBLIC_COZE_APP_ID',
      'NEXT_PUBLIC_COZE_AD_WORKFLOW_ID',
      'NEXT_PUBLIC_COZE_AD_APP_ID',
    ],
  };

  const getEnvCategory = (key: string) => {
    for (const [category, keys] of Object.entries(frontendCategories)) {
      if (keys.includes(key)) return category;
    }
    return '其他配置';
  };

  const filteredFrontendEnv = filterEnvVars(envConfig.frontend_env, searchTerm);
  const groupedFrontendEnv = Object.entries(filteredFrontendEnv).reduce(
    (acc, [key, value]) => {
      const category = getEnvCategory(key);
      if (!acc[category]) acc[category] = {};
      acc[category][key] = value;
      return acc;
    },
    {} as Record<string, Record<string, string>>
  );

  return (
    <div className="container mx-auto p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">环境变量管理</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={openFrontendEditDialog} disabled={loading}>
            <Globe className="h-4 w-4 mr-2" />
            前端配置
          </Button>
          <Button
            onClick={openBackendEditDialog}
            disabled={loading}
            variant="outline"
          >
            <Server className="h-4 w-4 mr-2" />
            后端配置
          </Button>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="搜索环境变量..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 前端环境变量 */}
      <div className="space-y-6">
        {Object.entries(groupedFrontendEnv).map(([category, vars]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(vars).map(([key, value]) => {
                  const isSensitive =
                    key.includes('API_KEY') ||
                    key.includes('TOKEN') ||
                    key.includes('SECRET');
                  const displayValue =
                    isSensitive && !showPasswords[key]
                      ? value.replace(/./g, '*')
                      : value;

                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Label className="font-mono text-sm font-medium">
                            {key}
                          </Label>
                          {isSensitive && (
                            <Badge variant="secondary" className="text-xs">
                              敏感信息
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-white px-2 py-1 rounded border font-mono">
                            {displayValue}
                          </code>
                          {isSensitive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePasswordVisibility(key)}
                              className="h-6 w-6 p-0"
                            >
                              {showPasswords[key] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 后端配置信息 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            后端配置信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(envConfig.backend_config).map(([key, value]) => {
              const displayValue = Array.isArray(value)
                ? value.join(', ')
                : String(value);
              const isSensitive = key === 'SECRET_KEY';
              const maskedValue = isSensitive ? String(value) : displayValue;

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="font-mono text-sm font-medium">
                        {key}
                      </Label>
                      {isSensitive && (
                        <Badge variant="secondary" className="text-xs">
                          敏感信息
                        </Badge>
                      )}
                    </div>
                    <code className="text-sm bg-white px-2 py-1 rounded border font-mono">
                      {maskedValue}
                    </code>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 前端环境变量编辑对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑前端环境变量</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {Object.entries(frontendCategories).map(([category, keys]) => (
              <div key={category}>
                <h4 className="font-medium mb-3">{category}</h4>
                <div className="grid grid-cols-1 gap-3">
                  {keys.map((key) => (
                    <div key={key}>
                      <Label
                        htmlFor={`edit-${key}`}
                        className="font-mono text-sm"
                      >
                        {key}
                      </Label>
                      <Input
                        id={`edit-${key}`}
                        type={
                          key.includes('API_KEY') ||
                          key.includes('TOKEN') ||
                          key.includes('SECRET')
                            ? 'password'
                            : 'text'
                        }
                        value={editingData[key] || ''}
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            [key]: e.target.value,
                          })
                        }
                        placeholder={`输入 ${key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={saveFrontendEnv} disabled={loading}>
              {loading ? (
                <ButtonLoading className="mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 后端配置编辑对话框 */}
      <Dialog open={showBackendDialog} onOpenChange={setShowBackendDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑后端配置</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="debug">调试模式</Label>
              <Select
                value={editingData.DEBUG || 'False'}
                onValueChange={(value) =>
                  setEditingData({ ...editingData, DEBUG: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择调试模式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="True">启用</SelectItem>
                  <SelectItem value="False">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="secret-key">SECRET_KEY</Label>
              <Input
                id="secret-key"
                type="password"
                value={editingData.SECRET_KEY || ''}
                onChange={(e) =>
                  setEditingData({ ...editingData, SECRET_KEY: e.target.value })
                }
                placeholder="输入SECRET_KEY"
              />
            </div>
            <div>
              <Label htmlFor="allowed-hosts">允许的主机 (用逗号分隔)</Label>
              <Input
                id="allowed-hosts"
                value={
                  Array.isArray(editingData.ALLOWED_HOSTS)
                    ? editingData.ALLOWED_HOSTS.join(', ')
                    : editingData.ALLOWED_HOSTS || ''
                }
                onChange={(e) =>
                  setEditingData({
                    ...editingData,
                    ALLOWED_HOSTS: e.target.value
                      .split(',')
                      .map((h) => h.trim())
                      .filter((h) => h),
                  })
                }
                placeholder="localhost,127.0.0.1"
              />
            </div>
            <div>
              <Label htmlFor="cors-origins">CORS允许的来源 (用逗号分隔)</Label>
              <Input
                id="cors-origins"
                value={
                  Array.isArray(editingData.CORS_ALLOWED_ORIGINS)
                    ? editingData.CORS_ALLOWED_ORIGINS.join(', ')
                    : editingData.CORS_ALLOWED_ORIGINS || ''
                }
                onChange={(e) =>
                  setEditingData({
                    ...editingData,
                    CORS_ALLOWED_ORIGINS: e.target.value
                      .split(',')
                      .map((h) => h.trim())
                      .filter((h) => h),
                  })
                }
                placeholder="http://localhost:3000,http://127.0.0.1:3000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBackendDialog(false)}
            >
              取消
            </Button>
            <Button onClick={saveBackendEnv} disabled={loading}>
              {loading ? (
                <ButtonLoading className="mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
