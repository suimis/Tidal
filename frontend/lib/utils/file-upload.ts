import { Attachment } from 'ai';
import { toast } from 'sonner';
import { uploadFileToCoze } from './coze-file-upload';

// 保持向后兼容的文件类型映射
const SUPPORTED_FILE_TYPES = {
  // 纯文本文件
  'text/plain': '.txt',
  'text/markdown': '.md',
  'application/json': '.json',
  'text/csv': '.csv',
  'text/html': '.html',
  'text/css': '.css',
  'text/javascript': '.js',
  'application/xml': '.xml',
  'text/xml': '.xml',

  // 图片文件
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
};

// 最大文件大小 (20MB) - 保持向后兼容
const MAX_FILE_SIZE = 20 * 1024 * 1024;

/**
 * 验证文件类型和大小
 */
function validateFile(file: File): boolean {
  // 检查文件类型
  if (!SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES]) {
    toast.error(`不支持的文件类型: ${file.type}`);
    return false;
  }

  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    toast.error(
      `文件大小超过限制 (最大 20MB): ${(file.size / 1024 / 1024).toFixed(2)}MB`
    );
    return false;
  }

  return true;
}

/**
 * 上传文件并转换为 Attachment 格式（使用Coze API）
 */
export async function uploadFile(file: File): Promise<Attachment | undefined> {
  try {
    // 验证文件
    if (!validateFile(file)) {
      return undefined;
    }

    // 使用Coze API上传文件
    const result = await uploadFileToCoze(file, undefined, MAX_FILE_SIZE);

    if (result) {
      return result.attachment;
    }

    return undefined;
  } catch (error) {
    console.error('文件上传失败:', error);
    toast.error(`文件上传失败: ${file.name}`);
    return undefined;
  }
}

/**
 * 批量上传文件
 */
export async function uploadFiles(files: File[]): Promise<Attachment[]> {
  const uploadPromises = files.map((file) => uploadFile(file));
  const results = await Promise.all(uploadPromises);
  return results.filter(
    (attachment): attachment is Attachment => attachment !== undefined
  );
}

/**
 * 获取文件图标
 */
export function getFileIcon(contentType: string): string {
  // 图片文件
  if (contentType.startsWith('image/')) return '🖼️';

  // 文本文件
  if (contentType === 'application/json') return '🔧';
  if (contentType === 'text/csv') return '📊';
  if (contentType === 'text/markdown') return '📝';
  if (contentType === 'text/html') return '🌐';
  if (contentType === 'text/css') return '🎨';
  if (contentType === 'text/javascript') return '⚡';
  if (contentType.includes('xml')) return '📋';
  if (contentType.startsWith('text/')) return '📄';
  return '📎';
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
