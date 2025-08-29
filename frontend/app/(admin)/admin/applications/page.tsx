'use client';

import { useState, useEffect } from 'react';
import { getCookie } from '@/lib/utils/cookies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconSelector } from '@/components/ui/icon-selector';
import { IconDisplay } from '@/components/ui/icon-display';
import { Database, Plus, Edit, Users, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { FullScreenLoading } from '@/components/ui/loading-spinner';
import { useApplications } from '@/contexts/ApplicationContext';
import { ApplicationUsersDialog } from '@/components/application-users-dialog';

interface Application {
  name: string;
  api_url: string;
  api_key: string;
  type: string;
  icon: string;
  member_count?: number;
}

export default function ApplicationsManagePage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUsersDialog, setShowUsersDialog] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newApp, setNewApp] = useState({
    name: '',
    api_url: '',
    api_key: '',
    type: '',
    icon: 'MessageSquare',
  });
  const [editApp, setEditApp] = useState({
    name: '',
    api_url: '',
    api_key: '',
    type: '',
    icon: 'MessageSquare',
  });
  const { refreshApplications } = useApplications();

  // 应用类型选项
  const applicationTypes = [
    { value: 'dify_application', label: 'Dify Application' },
    { value: 'dify_agent', label: 'Dify Agent' },
  ];

  // 获取所有应用
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/GPT/getAllApps', {
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
        setApplications(data.applications);
      } else {
        throw new Error(data.message || '获取应用列表失败');
      }
    } catch (error) {
      console.error('获取应用列表失败:', error);
      toast.error('获取应用列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建新应用
  const createApplication = async () => {
    try {
      const response = await fetch('http://localhost:8000/GPT/createApp', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify(newApp),
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('应用创建成功');
        setShowCreateDialog(false);
        setNewApp({
          name: '',
          api_url: '',
          api_key: '',
          type: '',
          icon: 'MessageSquare',
        });
        fetchApplications();
        // 刷新ApplicationContext中的应用列表
        refreshApplications();
      } else {
        throw new Error(data.message || '创建应用失败');
      }
    } catch (error) {
      console.error('创建应用失败:', error);
      toast.error('创建应用失败');
    }
  };

  // 查看应用用户
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const viewApplicationUsers = async (_appName: string) => {
    try {
      const response = await fetch(
        'http://localhost:8000/GPT/get_application_users',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') || '',
          },
          body: JSON.stringify({
            application_name: _appName,
          }),
        }
      );

      const data = await response.json();
      if (data.status === 'success') {
        const userList = data.users
          .map((user: { username: string }) => user.username)
          .join(', ');
        alert(`应用 "${_appName}" 的用户列表:\n${userList || '暂无用户'}`);
      } else {
        throw new Error(data.message || '获取应用用户失败');
      }
    } catch (error) {
      console.error('获取应用用户失败:', error);
      toast.error('获取应用用户失败');
    }
  };

  // 打开编辑对话框
  const openEditDialog = (app: Application) => {
    setSelectedApp(app);
    setEditApp({
      name: app.name,
      api_url: app.api_url,
      api_key: app.api_key,
      type: app.type,
      icon: app.icon,
    });
    setShowEditDialog(true);
  };

  // 更新应用
  const updateApplication = async () => {
    try {
      const response = await fetch('http://localhost:8000/GPT/updateApp', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify(editApp),
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('应用更新成功');
        setShowEditDialog(false);
        setSelectedApp(null);
        fetchApplications();
        // 刷新ApplicationContext中的应用列表
        refreshApplications();
      } else {
        throw new Error(data.message || '更新应用失败');
      }
    } catch (error) {
      console.error('更新应用失败:', error);
      toast.error('更新应用失败');
    }
  };

  // 打开删除确认对话框
  const openDeleteDialog = (app: Application) => {
    setSelectedApp(app);
    setShowDeleteDialog(true);
  };

  // 删除应用
  const deleteApplication = async () => {
    if (!selectedApp) return;

    try {
      const response = await fetch('http://localhost:8000/GPT/deleteApp', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify({
          name: selectedApp.name,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('应用删除成功');
        setShowDeleteDialog(false);
        setSelectedApp(null);
        fetchApplications();
        // 刷新ApplicationContext中的应用列表
        refreshApplications();
      } else {
        throw new Error(data.message || '删除应用失败');
      }
    } catch (error) {
      console.error('删除应用失败:', error);
      toast.error('删除应用失败');
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  if (loading) {
    return <FullScreenLoading />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          <h1 className="text-2xl font-bold">应用管理</h1>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建应用
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建新应用</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">应用名称</Label>
                  <Input
                    id="name"
                    value={newApp.name}
                    onChange={(e) =>
                      setNewApp({ ...newApp, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="type">应用类型</Label>
                  <Select
                    value={newApp.type}
                    onValueChange={(value) =>
                      setNewApp({ ...newApp, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择应用类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {applicationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="api_url">API URL</Label>
                  <Input
                    id="api_url"
                    value={newApp.api_url}
                    onChange={(e) =>
                      setNewApp({ ...newApp, api_url: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="api_key">API Key</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={newApp.api_key}
                    onChange={(e) =>
                      setNewApp({ ...newApp, api_key: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="icon">图标</Label>
                  <IconSelector
                    value={newApp.icon}
                    onChange={(iconName) =>
                      setNewApp({ ...newApp, icon: iconName })
                    }
                    placeholder="选择应用图标"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                取消
              </Button>
              <Button onClick={createApplication}>创建</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索框 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="搜索应用名称、类型或URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 应用表格 */}
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>应用名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>API URL</TableHead>
              <TableHead>图标</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications
              .filter(
                (app) =>
                  app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  app.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  app.api_url.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((app) => (
                <TableRow key={app.name}>
                  <TableCell>
                    <span className="font-medium">{app.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{app.type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {app.api_url}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <IconDisplay iconName={app.icon} className="h-5 w-5" />
                      <span className="text-sm text-gray-500">{app.icon}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApp(app);
                          setShowUsersDialog(true);
                        }}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(app)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(app)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* 编辑应用对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑应用</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-api-url">API URL</Label>
              <Input
                id="edit-api-url"
                value={editApp.api_url}
                onChange={(e) =>
                  setEditApp({ ...editApp, api_url: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-api-key">API Key</Label>
              <Input
                id="edit-api-key"
                type="password"
                value={editApp.api_key}
                onChange={(e) =>
                  setEditApp({ ...editApp, api_key: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-type">应用类型</Label>
              <Select
                value={editApp.type}
                onValueChange={(value) =>
                  setEditApp({ ...editApp, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择应用类型" />
                </SelectTrigger>
                <SelectContent>
                  {applicationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-icon">图标</Label>
              <IconSelector
                value={editApp.icon}
                onChange={(iconName) =>
                  setEditApp({ ...editApp, icon: iconName })
                }
                placeholder="选择应用图标"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={updateApplication}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除应用确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p>
            确定要删除应用 &quot;{selectedApp?.name}&quot; 吗？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={deleteApplication}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 应用用户管理对话框 */}
      <ApplicationUsersDialog
        open={showUsersDialog}
        onOpenChange={setShowUsersDialog}
        applicationName={selectedApp?.name || ''}
        onSuccess={fetchApplications}
      />
    </div>
  );
}
