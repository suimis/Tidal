import { UserGuard } from '@/components/auth-guard';

export default function ApplicationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserGuard>{children}</UserGuard>;
}
