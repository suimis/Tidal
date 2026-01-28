'use client';

import { useState, useEffect, useCallback } from 'react';
import { GalleryVerticalEnd, Plus, MessageSquare, Link } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const handleNewChat = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpenMobile(false);

      router.push(`/chat?new=${Date.now()}`);
    },
    [router, setOpenMobile],
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
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="新对话">
                <span className="cursor-pointer" onClick={handleNewChat}>
                  <Plus />
                  <span>新对话</span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="coze">
                <span
                  className="cursor-pointer"
                  onClick={() => {
                    router.push('/coze/ad');
                    setOpenMobile(false);
                  }}
                >
                  <Link />
                  <span>coze</span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
