/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, prefer-const, react/no-unescaped-entities */
'use client';

import DotBackground from '@/components/dot-background';
import { ResetForm } from '@/components/reset-form';
import { SubmitButton } from '@/components/submit-button';
import Link from 'next/link';

import { useState } from 'react';

export default function Page() {
  const [isSuccess, SetIsSuccess] = useState(false);
  // 占位用
  const handleSubmit = async (formData: FormData) => {};

  return (
    <div className="flex flex-col h-dvh w-screen items-center pt-12 justify-center">
      <DotBackground zIndex={-5} />
      <div className="mb-8 font-semibold text-xl">重置密码</div>
      <div className="inline-block min-h-[23rem] w-[23rem] overflow-hidden rounded-2xl flex flex-col gap-12">
        <ResetForm action={handleSubmit} defaultEmail="">
          <SubmitButton isSuccessful={isSuccess}>重置密码</SubmitButton>
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            {'新密码不能和现密码相同，点击此处 '}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              返回
            </Link>
          </p>
        </ResetForm>
      </div>
    </div>
  );
}
