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
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Key,
  Search,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { PasswordResetDialog } from '@/components/password-reset-dialog';
import { FullScreenLoading } from '@/components/ui/loading-spinner';

interface User {
  username: string;
  email: string;
  department_name: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  is_superuser: boolean;
}

// 部门选项列表
const departmentOptions = [
  '市场部',
  '数字广告部',
  '协同发展部',
  '银行服务部',
  '产品部',
  '技术部',
  '数据部',
  '法律合规部',
  '办公室',
  '人力资源部',
  '计划财务部',
  '纪检与审计办公室',
  '采购部',
  '北京分公司',
];

export default function UsersManagePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    email: '',
    department_name: '',
    applications: [] as string[],
  });
  const [editUser, setEditUser] = useState({
    username: '',
    email: '',
    department_name: '',
    is_active: true,
    applications: [] as string[],
  });

  // 获取所有用户
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/GPT/get_all_users', {
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
        setUsers(data.users);
      } else {
        throw new Error(data.message || '获取用户列表失败');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      toast.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建新用户
  const createUser = async () => {
    try {
      const response = await fetch('http://localhost:8000/GPT/create_user', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('用户创建成功');
        setShowCreateDialog(false);
        setNewUser({
          username: '',
          password: '',
          email: '',
          department_name: '',
          applications: [],
        });
        fetchUsers();
      } else {
        throw new Error(data.message || '创建用户失败');
      }
    } catch (error) {
      console.error('创建用户失败:', error);
      toast.error('创建用户失败');
    }
  };

  // 切换用户状态
  const toggleUserStatus = async (user: User) => {
    try {
      const response = await fetch('http://localhost:8000/GPT/update_user', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify({
          username: user.username,
          email: user.email,
          department_name: user.department_name,
          is_active: !user.is_active,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success(`用户已${!user.is_active ? '激活' : '禁用'}`);
        fetchUsers();
      } else {
        throw new Error(data.message || '更新用户状态失败');
      }
    } catch (error) {
      console.error('更新用户状态失败:', error);
      toast.error('更新用户状态失败');
    }
  };

  // 打开编辑对话框
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      username: user.username,
      email: user.email,
      department_name: user.department_name,
      is_active: user.is_active,
      applications: [],
    });
    setShowEditDialog(true);
  };

  // 更新用户
  const updateUser = async () => {
    try {
      const response = await fetch('http://localhost:8000/GPT/update_user', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify(editUser),
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('用户更新成功');
        setShowEditDialog(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        throw new Error(data.message || '更新用户失败');
      }
    } catch (error) {
      console.error('更新用户失败:', error);
      toast.error('更新用户失败');
    }
  };

  // 打开删除确认对话框
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  // 删除用户
  const deleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch('http://localhost:8000/GPT/delete_user', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify({
          username: selectedUser.username,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('用户删除成功');
        setShowDeleteDialog(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        throw new Error(data.message || '删除用户失败');
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      toast.error('删除用户失败');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return <FullScreenLoading />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">用户管理</h1>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建用户
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建新用户</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">用户名</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser({ ...newUser, username: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="department">部门</Label>
                  <Select
                    value={newUser.department_name}
                    onValueChange={(value) =>
                      setNewUser({
                        ...newUser,
                        department_name: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择部门" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <Button onClick={createUser}>创建</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索框 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="搜索用户名、邮箱或部门..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 用户表格 */}
      <div className="table-compact">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="table-head">用户名</TableHead>
              <TableHead className="table-head">邮箱</TableHead>
              <TableHead className="table-head">部门</TableHead>
              <TableHead className="table-head">状态</TableHead>
              <TableHead className="table-head">注册时间</TableHead>
              <TableHead className="table-head">最后登录</TableHead>
              <TableHead className="table-head text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users
              .filter(
                (user) =>
                  user.username
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  user.department_name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
              )
              .map((user) => (
                <TableRow key={user.username}>
                  <TableCell className="table-cell">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.username}</span>
                      {user.is_superuser && <Badge>管理员</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="table-cell">{user.email}</TableCell>
                  <TableCell className="table-cell">
                    {user.department_name}
                  </TableCell>
                  <TableCell className="table-cell">
                    <Badge variant={user.is_active ? 'success' : 'secondary'}>
                      {user.is_active ? '活跃' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell className="table-cell">
                    {new Date(user.date_joined).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="table-cell">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleDateString()
                      : '从未登录'}
                  </TableCell>
                  <TableCell className="table-cell text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowPasswordDialog(true);
                        }}
                        title="重置密码"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        title="编辑用户"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleUserStatus(user)}
                        disabled={user.is_superuser}
                        title={user.is_active ? '禁用用户' : '激活用户'}
                      >
                        {user.is_active ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(user)}
                        disabled={user.is_superuser}
                        title="删除用户"
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

      {/* 编辑用户对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-email">邮箱</Label>
              <Input
                id="edit-email"
                type="email"
                value={editUser.email}
                onChange={(e) =>
                  setEditUser({ ...editUser, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-department">部门</Label>
              <Select
                value={editUser.department_name}
                onValueChange={(value) =>
                  setEditUser({ ...editUser, department_name: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择部门" />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={editUser.is_active}
                onChange={(e) =>
                  setEditUser({ ...editUser, is_active: e.target.checked })
                }
              />
              <Label htmlFor="edit-active">用户活跃状态</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={updateUser}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除用户确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p>
            确定要删除用户 &quot;{selectedUser?.username}&quot;
            吗？此操作将禁用该用户账户。
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={deleteUser}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 密码重置对话框 */}
      <PasswordResetDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        username={selectedUser?.username || ''}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
