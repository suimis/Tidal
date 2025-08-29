export function setCookie(name: string, value: string, days = 30) {
  const encodedValue = encodeURIComponent(value);
  const date = new Date();

  // 修正：使用正确的毫秒计算（避免浮点数问题）
  date.setTime(date.getTime() + days * 864e5); // 864e5 = 24*60*60*1000

  const expires = `expires=${date.toUTCString()}`;
  // 添加SameSite和Secure属性增强安全性（根据需求可选）
  document.cookie = `${name}=${encodedValue};${expires};path=/;SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  const cookieRegex = new RegExp(`(^| )${name}=([^;]+)`);
  const match = document.cookie.match(cookieRegex);

  if (match) {
    try {
      // 安全解码特殊字符
      return decodeURIComponent(match[2]);
    } catch {
      // 解码失败时返回原始值
      return match[2];
    }
  }
  return null;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}
