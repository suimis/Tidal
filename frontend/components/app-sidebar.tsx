'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GalleryVerticalEnd,
  Plus,
  MessageSquare,
  Users,
  Database,
  Cog,
  Shield,
  Lightbulb,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

import { NavApps } from '@/components/nav-apps';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import { getCookie } from '@/lib/utils/cookies';
import { useApplications } from '@/contexts/ApplicationContext';

// 动态获取图标组件 - 与 IconDisplay 组件使用相同的逻辑
const getIconComponent = (iconName: string) => {
  if (!iconName) return MessageSquare;

  // 转换为 PascalCase
  const pascalCase = iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (LucideIcons as any)[pascalCase] || MessageSquare;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { applications, loading } = useApplications();

  const [user, setUser] = useState({
    name: '用户',
    email: '',
    department: '',
    avatar: '/avatars/default.jpg',
    is_superuser: false,
  });

  // 转换应用数据格式以适配NavApps组件
  const transformedApps = useMemo(() => {
    return applications.map((app) => ({
      name: app.name,
      url: app.type || app.name.toLowerCase().replace(/\s+/g, '-'),
      icon: getIconComponent(app.icon),
    }));
  }, [applications]);

  // 获取用户信息
  useEffect(() => {
    const userCookie = getCookie('user');
    if (userCookie) {
      try {
        const loginUser = JSON.parse(userCookie);
        setUser({
          name: [loginUser.last_name, loginUser.first_name].join('') || '用户',
          email: loginUser.email || '',
          department: loginUser.department_name || '',
          avatar: loginUser.avatar || '/avatars/default.jpg',
          is_superuser: loginUser.is_superuser || false,
        });
      } catch (e) {
        console.error('解析用户信息失败', e);
      }
    }
  }, []);

  const handleNewChat = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpenMobile(false);
      // 通过添加时间戳参数触发新对话重置
      router.push(`/chat?new=${Date.now()}`);
    },
    [router, setOpenMobile]
  );

  const handleCozeAd = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpenMobile(false);
      router.push('/coze/ad');
    },
    [router, setOpenMobile]
  );

  const handleAdminUsers = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpenMobile(false);
      router.push('/admin/users');
    },
    [router, setOpenMobile]
  );

  const handleAdminApplications = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpenMobile(false);
      router.push('/admin/applications');
    },
    [router, setOpenMobile]
  );

  const handleAdminModels = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpenMobile(false);
      router.push('/admin/models');
    },
    [router, setOpenMobile]
  );

  const handleAdminSettings = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpenMobile(false);
      router.push('/admin/settings');
    },
    [router, setOpenMobile]
  );

  // 使用动态数据的NavApps
  const memoizedNavApps = useMemo(
    () => <NavApps projects={transformedApps} loading={loading} />,
    [transformedApps, loading]
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="cursor-pointer">
            <SidebarMenuButton size="lg" asChild>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/');
                  router.refresh();
                }}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Tidal</span>
                  <span className="">v0.1.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
              对话
            </SidebarGroupLabel>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="新对话">
                <span className="cursor-pointer" onClick={handleNewChat}>
                  <Plus />
                  <span>新对话</span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        {transformedApps.length > 0 && memoizedNavApps}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
              Coze
            </SidebarGroupLabel>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="广告">
                <span className="cursor-pointer" onClick={handleCozeAd}>
                  <Lightbulb />
                  <span>广告</span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* 管理员菜单 - 只有超级用户才能看到 */}
        {user.is_superuser && (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                系统管理
              </SidebarGroupLabel>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="用户管理">
                  <span className="cursor-pointer" onClick={handleAdminUsers}>
                    <Users />
                    <span>用户管理</span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="应用管理">
                  <span
                    className="cursor-pointer"
                    onClick={handleAdminApplications}
                  >
                    <Database />
                    <span>应用管理</span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="模型管理">
                  <span className="cursor-pointer" onClick={handleAdminModels}>
                    <Cog />
                    <span>模型管理</span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="系统设置">
                  <span
                    className="cursor-pointer"
                    onClick={handleAdminSettings}
                  >
                    <Shield />
                    <span>系统设置</span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
