import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 需要认证的路径
const protectedPaths = ['/chat', '/admin', '/applications'];

// 需要管理员权限的路径
const adminPaths = ['/admin'];

// 公开路径（不需要认证）
const publicPaths = ['/', '/login', '/reset'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否是公开路径
  if (
    publicPaths.some(
      (path) => pathname === path || pathname.startsWith(path + '/')
    )
  ) {
    return NextResponse.next();
  }

  // 检查是否是受保护的路径
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // 获取认证相关的 cookies
  const userCookie = request.cookies.get('user');
  const sessionCookie = request.cookies.get('sessionid');

  // 如果没有认证信息，重定向到首页
  if (!userCookie || !sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 检查管理员权限
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));

  if (isAdminPath) {
    try {
      const user = JSON.parse(userCookie.value);
      if (!user.is_superuser) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    } catch {
      // 如果解析用户信息失败，重定向到首页
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - api 路由
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     * - 其他静态资源
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
