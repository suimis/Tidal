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
import { Cog, Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { FullScreenLoading } from '@/components/ui/loading-spinner';

interface ModelInfo {
  id: number;
  show_name: string;
  model_name: string;
  model_url: string;
  model_key: string;
  model_type: string;
  model_provider: string;
  model_providerId: string;
}

export default function ModelsManagePage() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newModel, setNewModel] = useState({
    show_name: '',
    model_name: '',
    model_url: '',
    model_key: '',
    model_type: '',
    model_provider: '',
    model_providerId: '',
  });
  const [editModel, setEditModel] = useState({
    id: 0,
    show_name: '',
    model_name: '',
    model_url: '',
    model_key: '',
    model_type: '',
    model_provider: '',
    model_providerId: '',
  });

  // 获取所有模型
  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/GPT/get_model_info', {
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
        setModels(data.models);
      } else {
        throw new Error(data.message || '获取模型列表失败');
      }
    } catch (error) {
      console.error('获取模型列表失败:', error);
      toast.error('获取模型列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建新模型
  const createModel = async () => {
    try {
      const response = await fetch('http://localhost:8000/GPT/create_model', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify(newModel),
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('模型创建成功');
        setShowCreateDialog(false);
        setNewModel({
          show_name: '',
          model_name: '',
          model_url: '',
          model_key: '',
          model_type: '',
          model_provider: '',
          model_providerId: '',
        });
        fetchModels();
      } else {
        throw new Error(data.message || '创建模型失败');
      }
    } catch (error) {
      console.error('创建模型失败:', error);
      toast.error('创建模型失败');
    }
  };

  // 打开编辑对话框
  const openEditDialog = (model: ModelInfo) => {
    setSelectedModel(model);
    setEditModel({
      id: model.id,
      show_name: model.show_name,
      model_name: model.model_name,
      model_url: model.model_url,
      model_key: model.model_key,
      model_type: model.model_type,
      model_provider: model.model_provider,
      model_providerId: model.model_providerId,
    });
    setShowEditDialog(true);
  };

  // 更新模型
  const updateModel = async () => {
    try {
      const response = await fetch('http://localhost:8000/GPT/update_model', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify(editModel),
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('模型更新成功');
        setShowEditDialog(false);
        setSelectedModel(null);
        fetchModels();
      } else {
        throw new Error(data.message || '更新模型失败');
      }
    } catch (error) {
      console.error('更新模型失败:', error);
      toast.error('更新模型失败');
    }
  };

  // 打开删除确认对话框
  const openDeleteDialog = (model: ModelInfo) => {
    setSelectedModel(model);
    setShowDeleteDialog(true);
  };

  // 删除模型
  const deleteModel = async () => {
    if (!selectedModel) return;

    try {
      const response = await fetch('http://localhost:8000/GPT/delete_model', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify({
          id: selectedModel.id,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('模型删除成功');
        setShowDeleteDialog(false);
        setSelectedModel(null);
        fetchModels();
      } else {
        throw new Error(data.message || '删除模型失败');
      }
    } catch (error) {
      console.error('删除模型失败:', error);
      toast.error('删除模型失败');
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  if (loading) {
    return <FullScreenLoading />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Cog className="h-6 w-6" />
          <h1 className="text-2xl font-bold">模型管理</h1>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加模型
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>添加新模型</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="show_name">显示名称</Label>
                  <Input
                    id="show_name"
                    value={newModel.show_name}
                    onChange={(e) =>
                      setNewModel({ ...newModel, show_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="model_name">模型名称</Label>
                  <Input
                    id="model_name"
                    value={newModel.model_name}
                    onChange={(e) =>
                      setNewModel({ ...newModel, model_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="model_url">模型 URL</Label>
                  <Input
                    id="model_url"
                    value={newModel.model_url}
                    onChange={(e) =>
                      setNewModel({ ...newModel, model_url: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="model_key">模型密钥</Label>
                  <Input
                    id="model_key"
                    type="password"
                    value={newModel.model_key}
                    onChange={(e) =>
                      setNewModel({ ...newModel, model_key: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="model_type">模型类型</Label>
                  <Input
                    id="model_type"
                    value={newModel.model_type}
                    onChange={(e) =>
                      setNewModel({ ...newModel, model_type: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="model_provider">提供商</Label>
                  <Input
                    id="model_provider"
                    value={newModel.model_provider}
                    onChange={(e) =>
                      setNewModel({
                        ...newModel,
                        model_provider: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="model_providerId">提供商 ID</Label>
                  <Input
                    id="model_providerId"
                    value={newModel.model_providerId}
                    onChange={(e) =>
                      setNewModel({
                        ...newModel,
                        model_providerId: e.target.value,
                      })
                    }
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
              <Button onClick={createModel}>添加</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索框 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="搜索模型名称、显示名称或提供商..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 模型表格 */}
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>显示名称</TableHead>
              <TableHead>模型名称</TableHead>
              <TableHead>提供商</TableHead>
              <TableHead>模型类型</TableHead>
              <TableHead>模型 URL</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models
              .filter(
                (model) =>
                  model.show_name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  model.model_name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  model.model_provider
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
              )
              .map((model) => (
                <TableRow key={model.id}>
                  <TableCell>
                    <span className="font-medium">{model.show_name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {model.model_name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{model.model_provider}</Badge>
                  </TableCell>
                  <TableCell>
                    {model.model_type && (
                      <Badge variant="secondary">{model.model_type}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm text-gray-600">
                      {model.model_url}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(model)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(model)}
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

      {/* 编辑模型对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑模型</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-show-name">显示名称</Label>
                <Input
                  id="edit-show-name"
                  value={editModel.show_name}
                  onChange={(e) =>
                    setEditModel({ ...editModel, show_name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-model-name">模型名称</Label>
                <Input
                  id="edit-model-name"
                  value={editModel.model_name}
                  onChange={(e) =>
                    setEditModel({ ...editModel, model_name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-model-url">模型 URL</Label>
                <Input
                  id="edit-model-url"
                  value={editModel.model_url}
                  onChange={(e) =>
                    setEditModel({ ...editModel, model_url: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-model-key">模型密钥</Label>
                <Input
                  id="edit-model-key"
                  type="password"
                  value={editModel.model_key}
                  onChange={(e) =>
                    setEditModel({ ...editModel, model_key: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-model-type">模型类型</Label>
                <Input
                  id="edit-model-type"
                  value={editModel.model_type}
                  onChange={(e) =>
                    setEditModel({ ...editModel, model_type: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-model-provider">提供商</Label>
                <Input
                  id="edit-model-provider"
                  value={editModel.model_provider}
                  onChange={(e) =>
                    setEditModel({
                      ...editModel,
                      model_provider: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-model-providerId">提供商 ID</Label>
                <Input
                  id="edit-model-providerId"
                  value={editModel.model_providerId}
                  onChange={(e) =>
                    setEditModel({
                      ...editModel,
                      model_providerId: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={updateModel}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除模型确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p>
            确定要删除模型 &quot;{selectedModel?.show_name}&quot;
            吗？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={deleteModel}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
