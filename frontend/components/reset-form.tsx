import Form from 'next/form';
import { Label } from '@/components/ui/label';
import { Input } from './ui/input';

export function ResetForm({
  action,
  children,
  defaultEmail = '',
}: {
  action: NonNullable<
    string | ((formdata: FormData) => void | Promise<void> | undefined)
  >;
  children: React.ReactNode;
  defaultEmail?: string;
}) {
  return (
    <Form action={action} className="flex flex-col gap-4 px-4">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="username"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          账号
        </Label>
        <Input
          id="username"
          name="username"
          placeholder="haotian.wei"
          className="bg-muted text-md md:text-sm"
          defaultValue={defaultEmail}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          旧密码
        </Label>
        <Input
          id="old_password"
          name="old_password"
          type="password"
          placeholder="请输入旧密码"
          className="bg-muted text-md md:text-sm"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          新密码
        </Label>
        <Input
          id="new_password"
          name="new_password"
          type="password"
          placeholder="请输入新密码"
          className="bg-muted text-md md:text-sm"
          required
        />
      </div>
      {children}
    </Form>
  );
}
