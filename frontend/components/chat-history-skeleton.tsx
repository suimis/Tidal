import { Skeleton } from '@/components/ui/skeleton';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function ChatHistorySkeleton() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarMenu>
        <SidebarGroupLabel>对话</SidebarGroupLabel>

        {/* 新对话按钮保持可用 */}
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-12" />
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* 今天分组骨架 */}
        <SidebarGroupLabel>
          <Skeleton className="h-4 w-8" />
        </SidebarGroupLabel>

        {/* 聊天历史项骨架 */}
        {[1, 2, 3].map((i) => (
          <SidebarMenuItem key={`chat-skeleton-${i}`}>
            <SidebarMenuButton>
              <div className="flex items-center justify-between w-full">
                <Skeleton
                  className={`h-4 ${
                    i === 1 ? 'w-24' : i === 2 ? 'w-20' : 'w-28'
                  }`}
                />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}

        {/* 昨天分组骨架 */}
        <SidebarGroupLabel>
          <Skeleton className="h-4 w-8" />
        </SidebarGroupLabel>

        {/* 更多聊天历史项骨架 */}
        {[1, 2].map((i) => (
          <SidebarMenuItem key={`chat-skeleton-yesterday-${i}`}>
            <SidebarMenuButton>
              <div className="flex items-center justify-between w-full">
                <Skeleton className={`h-4 ${i === 1 ? 'w-32' : 'w-16'}`} />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
