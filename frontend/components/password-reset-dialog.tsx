'use client';

import { useState } from 'react';
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
import { Eye, EyeOff, Key, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { ButtonLoading } from '@/components/ui/loading-spinner';

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  onSuccess: () => void;
}

// 密码强度检查函数
const checkPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };

  const strength = Object.values(checks).filter(Boolean).length;
  return { checks, strength };
};

export function PasswordResetDialog({
  open,
  onOpenChange,
  username,
  onSuccess,
}: PasswordResetDialogProps) {
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);

  const { checks, strength } = checkPasswordStrength(passwords.new);
  const passwordsMatch = passwords.new === passwords.confirm;
  const isValid = strength >= 4 && passwordsMatch && passwords.new.length > 0;

  const resetPassword = async () => {
    if (!isValid) return;

    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/GPT/reset_password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify({
          username,
          new_password: passwords.new,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('密码重置成功');
        onOpenChange(false);
        onSuccess();
        // 重置表单
        setPasswords({ new: '', confirm: '' });
      } else {
        throw new Error(data.message || '密码重置失败');
      }
    } catch (error) {
      console.error('密码重置失败:', error);
      toast.error('密码重置失败');
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

  const getStrengthColor = () => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (strength <= 2) return '弱';
    if (strength <= 3) return '中';
    return '强';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            重置密码 - {username}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 新密码输入 */}
          <div className="space-y-2">
            <Label htmlFor="new-password">新密码</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwords.new}
                onChange={(e) =>
                  setPasswords({ ...passwords, new: e.target.value })
                }
                placeholder="请输入新密码"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    new: !showPasswords.new,
                  })
                }
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* 密码强度指示器 */}
            {passwords.new && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getStrengthColor()}`}
                      style={{ width: `${(strength / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {getStrengthText()}
                  </span>
                </div>

                {/* 密码要求检查 */}
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    {checks.length ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        checks.length ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      至少8个字符
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {checks.uppercase && checks.lowercase ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        checks.uppercase && checks.lowercase
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      包含大小写字母
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {checks.number ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        checks.number ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      包含数字
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {checks.special ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        checks.special ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      包含特殊字符 (@$!%*?&)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 确认密码输入 */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">确认密码</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirm: e.target.value })
                }
                placeholder="请再次输入新密码"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    confirm: !showPasswords.confirm,
                  })
                }
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* 密码匹配检查 */}
            {passwords.confirm && (
              <div className="flex items-center gap-2 text-sm">
                {passwordsMatch ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">密码匹配</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">密码不匹配</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button onClick={resetPassword} disabled={!isValid || loading}>
            {loading ? <ButtonLoading /> : '重置密码'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
