// 禁用静态生成，强制动态渲染
export const dynamic = 'force-dynamic';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-dvh w-full flex overflow-auto">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
