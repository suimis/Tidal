/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, prefer-const, react/no-unescaped-entities */
'use client';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import DotBackground from '@/components/dot-background';
import Link from 'next/link';
import { useState } from 'react';
import { signIn } from '../auth';
import { useRouter } from 'next/navigation';
import { setCookie } from '@/lib/utils/cookies';
import { toast } from 'sonner';
import { Player } from '@lottiefiles/react-lottie-player';

export default function Page() {
  const [isSuccess, SetIsSuccess] = useState(false);
  const router = useRouter();
  // 占位用
  const handleSubmit = async (formData: FormData) => {
    const { status, user } = await signIn(formData);

    if (status === 'success') {
      setCookie('user', JSON.stringify(user));
      router.push('/chat');
    } else {
      toast.error('登录失败！用户名或密码错误！');
    }
  };

  return (
    <div className="flex flex-col h-dvh w-screen items-center pt-12 justify-center relative">
      <DotBackground />
      <div className="mb-2 font-bold text-xl relative z-10">登录 Tidal</div>
      <div className="mb-6 text-sm relative z-10">开启你的创作之旅</div>
      <div className="inline-block min-h-[23rem] w-[23rem] overflow-hidden rounded-2xl flex flex-col gap-12 relative z-10">
        <AuthForm action={handleSubmit} defaultEmail="">
          <SubmitButton isSuccessful={isSuccess}>登陆</SubmitButton>
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            {'使用域账号与密码登陆，点击此处 '}
            <Link
              href="/reset"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              修改密码
            </Link>
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
