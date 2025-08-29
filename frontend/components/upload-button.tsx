import { Upload } from 'lucide-react';

export interface UploadButtonProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  status: string;
  acceptedFileTypes?: string[]; // 例如 ['image/*', '.pdf', '.doc']
  maxFileSize?: number; // 例如 10 * 1024 * 1024 (10MB)
  onFileSelect?: (file: File) => void;
}

export default function UploadButton({
  fileInputRef,
  status,
  acceptedFileTypes,
  maxFileSize,
  onFileSelect,
}: UploadButtonProps) {
  // 避免未使用参数的警告
  void maxFileSize;
  void onFileSelect;
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready'}
      className="bg-neutral-400/50 cursor-pointer size-7 rounded-sm flex justify-center items-center duration-200 hover:opacity-90 hover:ring-1 hover:ring-indigo-500/50 disabled:cursor-not-allowed"
      title={
        acceptedFileTypes
          ? `支持格式: ${acceptedFileTypes.join(', ')}`
          : '上传文件'
      }
    >
      <Upload size={14} />
    </button>
  );
}
