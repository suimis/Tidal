import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { UserGuard } from '@/components/auth-guard';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <UserGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="h-dvh w-full flex items-center overflow-y-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </UserGuard>
  );
}
