'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Users, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  username: string;
  email: string;
  department_name: string;
  is_active: boolean;
  date_joined: string;
}

interface ApplicationUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationName: string;
  onSuccess?: () => void;
}

export function ApplicationUsersDialog({
  open,
  onOpenChange,
  applicationName,
  onSuccess,
}: ApplicationUsersDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // 获取应用用户列表
  const fetchApplicationUsers = async () => {
    try {
      setLoading(true);
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
            application_name: applicationName,
          }),
        }
      );

      const data = await response.json();
      if (data.status === 'success') {
        setUsers(data.users);
      } else {
        throw new Error(data.message || '获取应用用户失败');
      }
    } catch (error) {
      console.error('获取应用用户失败:', error);
      toast.error('获取应用用户失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取所有用户列表
  const fetchAllUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/GPT/get_all_users', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
      });

      const data = await response.json();
      if (data.status === 'success') {
        setAllUsers(data.users);
      } else {
        throw new Error(data.message || '获取用户列表失败');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  };

  // 管理用户权限
  const manageUserPermissions = async (action: 'add' | 'remove') => {
    if (selectedUsers.size === 0) {
      toast.error('请选择要操作的用户');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        'http://localhost:8000/GPT/manage_user_applications',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') || '',
          },
          body: JSON.stringify({
            username: Array.from(selectedUsers)[0], // 暂时只处理单个用户
            action,
            applications: [applicationName],
          }),
        }
      );

      const data = await response.json();
      if (data.status === 'success') {
        toast.success(
          action === 'add' ? '添加用户权限成功' : '移除用户权限成功'
        );
        setSelectedUsers(new Set());
        fetchApplicationUsers();
        onSuccess?.();
      } else {
        throw new Error(data.message || '操作失败');
      }
    } catch (error) {
      console.error('管理用户权限失败:', error);
      toast.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const getCookie = (name: string) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + '=') {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  // 过滤用户列表
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 过滤未拥有权限的用户
  const availableUsers = allUsers.filter(
    (user) =>
      !users.some((appUser) => appUser.username === user.username) &&
      (user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    if (open) {
      fetchApplicationUsers();
      fetchAllUsers();
    }
  }, [open, applicationName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {applicationName} - 用户权限管理
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="搜索用户..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 已有权限的用户 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  已有权限用户 ({filteredUsers.length})
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => manageUserPermissions('remove')}
                  disabled={selectedUsers.size === 0 || loading}
                >
                  <UserMinus className="h-4 w-4 mr-1" />
                  移除权限
                </Button>
              </div>
              <div className="h-64 border rounded-md overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(
                                new Set(
                                  filteredUsers.map((user) => user.username)
                                )
                              );
                            } else {
                              setSelectedUsers(new Set());
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>用户名</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.username}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.username)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedUsers);
                              if (e.target.checked) {
                                newSelected.add(user.username);
                              } else {
                                newSelected.delete(user.username);
                              }
                              setSelectedUsers(newSelected);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.department_name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.is_active ? 'default' : 'secondary'}
                          >
                            {user.is_active ? '活跃' : '禁用'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* 可添加权限的用户 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  可添加用户 ({availableUsers.length})
                </Label>
                <Button
                  size="sm"
                  onClick={() => manageUserPermissions('add')}
                  disabled={selectedUsers.size === 0 || loading}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  添加权限
                </Button>
              </div>
              <div className="h-64 border rounded-md overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(
                                new Set(
                                  availableUsers.map((user) => user.username)
                                )
                              );
                            } else {
                              setSelectedUsers(new Set());
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>用户名</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableUsers.map((user) => (
                      <TableRow key={user.username}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.username)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedUsers);
                              if (e.target.checked) {
                                newSelected.add(user.username);
                              } else {
                                newSelected.delete(user.username);
                              }
                              setSelectedUsers(newSelected);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.department_name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.is_active ? 'default' : 'secondary'}
                          >
                            {user.is_active ? '活跃' : '禁用'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
