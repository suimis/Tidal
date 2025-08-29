import { Attachment } from 'ai';
import { toast } from 'sonner';

// Coze API支持的文件类型
export const COZE_FILE_TYPES = {
  // 文档
  documents: {
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf',
      'application/vnd.apple.numbers',
      'text/csv',
    ],
    extensions: [
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.ppt',
      '.pptx',
      '.pdf',
      '.numbers',
      '.csv',
    ],
    description: '文档文件',
  },

  // 文本文件
  text: {
    mimeTypes: [
      'text/javascript',
      'text/x-c++src',
      'text/x-python',
      'text/x-java-source',
      'text/x-c',
      'text/plain',
      'text/css',
      'application/javascript',
      'text/html',
      'application/json',
      'text/markdown',
    ],
    extensions: [
      '.js',
      '.cpp',
      '.py',
      '.java',
      '.c',
      '.txt',
      '.css',
      '.javascript',
      '.html',
      '.json',
      '.md',
    ],
    description: '文本文件',
  },

  // 图片
  images: {
    mimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/bmp',
      'image/pcd',
      'image/tiff',
    ],
    extensions: [
      '.jpg',
      '.jpg2',
      '.png',
      '.gif',
      '.webp',
      '.heic',
      '.heif',
      '.bmp',
      '.pcd',
      '.tiff',
    ],
    description: '图片文件',
  },

  // 音频
  audio: {
    mimeTypes: [
      'audio/wav',
      'audio/mpeg',
      'audio/flac',
      'audio/mp4',
      'audio/aac',
      'audio/ogg',
      'audio/x-ms-wma',
      'audio/midi',
    ],
    extensions: [
      '.wav',
      '.mp3',
      '.flac',
      '.m4a',
      '.aac',
      '.ogg',
      '.wma',
      '.midi',
    ],
    description: '音频文件',
  },

  // 视频
  video: {
    mimeTypes: [
      'video/mp4',
      'video/x-msvideo',
      'video/quicktime',
      'video/3gpp',
      'video/x-flv',
      'video/webm',
      'video/x-ms-wmv',
      'video/x-rm',
      'video/x-m4v',
      'video/x-matroska',
    ],
    extensions: [
      '.mp4',
      '.avi',
      '.mov',
      '.3gp',
      '.3gpp',
      '.flv',
      '.webm',
      '.wmv',
      '.rmvb',
      '.m4v',
      '.mkv',
    ],
    description: '视频文件',
  },

  // 压缩文件
  archives: {
    mimeTypes: [
      'application/x-rar-compressed',
      'application/zip',
      'application/x-7z-compressed',
      'application/gzip',
      'application/x-gzip',
      'application/x-bzip2',
    ],
    extensions: ['.rar', '.zip', '.7z', '.gz', '.gzip', '.bz2'],
    description: '压缩文件',
  },
};

// 文件类型分组
export const FILE_TYPE_GROUPS = {
  all: {
    mimeTypes: Object.values(COZE_FILE_TYPES).flatMap(
      (group) => group.mimeTypes
    ),
    extensions: Object.values(COZE_FILE_TYPES).flatMap(
      (group) => group.extensions
    ),
    description: '所有支持的文件',
  },
  images: COZE_FILE_TYPES.images,
  documents: COZE_FILE_TYPES.documents,
  text: COZE_FILE_TYPES.text,
  audio: COZE_FILE_TYPES.audio,
  video: COZE_FILE_TYPES.video,
  archives: COZE_FILE_TYPES.archives,
};

// 最大文件大小 (512MB)
const MAX_FILE_SIZE = 512 * 1024 * 1024;

/**
 * 验证文件类型和大小
 */
export function validateFile(
  file: File,
  acceptedTypes?: string[],
  maxSize: number = MAX_FILE_SIZE
): { isValid: boolean; error?: string } {
  // 检查文件大小
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `文件大小超过限制 (最大 ${formatFileSize(
        maxSize
      )}): ${formatFileSize(file.size)}`,
    };
  }

  // 如果没有指定接受的类型，则接受所有支持的类型
  if (!acceptedTypes || acceptedTypes.length === 0) {
    // 检查是否在Coze支持的类型中
    const allSupportedMimes = FILE_TYPE_GROUPS.all.mimeTypes;
    const allSupportedExts = FILE_TYPE_GROUPS.all.extensions;

    const isMimeTypeSupported = allSupportedMimes.includes(file.type);
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isExtensionSupported = allSupportedExts.includes(fileExtension);

    if (!isMimeTypeSupported && !isExtensionSupported) {
      return {
        isValid: false,
        error: `不支持的文件类型: ${file.type || fileExtension}`,
      };
    }

    return { isValid: true };
  }

  // 检查文件类型是否在接受的类型中
  const isAccepted = acceptedTypes.some((type) => {
    if (type.startsWith('.')) {
      // 扩展名匹配
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      return type.toLowerCase() === fileExtension;
    } else if (type.includes('/*')) {
      // MIME类型组匹配，如 image/*
      const mimeTypeGroup = type.split('/*')[0];
      return file.type.startsWith(mimeTypeGroup);
    } else {
      // 精确MIME类型匹配
      return file.type === type;
    }
  });

  if (!isAccepted) {
    return {
      isValid: false,
      error: `不接受的文件类型: ${file.type}`,
    };
  }

  return { isValid: true };
}

/**
 * 上传文件到Coze
 */
export async function uploadFileToCoze(
  file: File,
  acceptedTypes?: string[],
  maxSize: number = MAX_FILE_SIZE
): Promise<{ attachment: Attachment; fileId: string } | undefined> {
  try {
    // 验证文件
    const validation = validateFile(file, acceptedTypes, maxSize);
    if (!validation.isValid) {
      toast.error(validation.error);
      return undefined;
    }

    // 创建FormData
    const formData = new FormData();
    formData.append('file', file);

    // 获取API Token
    const apiToken = process.env.NEXT_PUBLIC_COZE_API_TOKEN;
    if (!apiToken) {
      toast.error('缺少Coze API Token配置');
      return undefined;
    }

    // 上传文件
    const response = await fetch('https://api.coze.cn/v1/files/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Coze API上传失败:', errorText);
      toast.error(`文件上传失败: ${response.status} ${response.statusText}`);
      return undefined;
    }

    const result = await response.json();

    if (result.code !== 0) {
      console.error('Coze API返回错误:', result);
      toast.error(`文件上传失败: ${result.msg || '未知错误'}`);
      return undefined;
    }

    // 创建Attachment对象
    const attachment: Attachment = {
      name: file.name,
      contentType: file.type,
      url: URL.createObjectURL(file), // 创建本地URL用于预览
    };

    toast.success(`文件上传成功: ${file.name}`);

    return {
      attachment,
      fileId: result.data.id, // Coze返回的文件ID
    };
  } catch (error) {
    console.error('文件上传失败:', error);
    toast.error(
      `文件上传失败: ${error instanceof Error ? error.message : '未知错误'}`
    );
    return undefined;
  }
}

/**
 * 批量上传文件到Coze
 */
export async function uploadFilesToCoze(
  files: File[],
  acceptedTypes?: string[],
  maxSize: number = MAX_FILE_SIZE,
  onProgress?: (progress: number, currentFile: string) => void
): Promise<{ attachment: Attachment; fileId: string }[]> {
  const results: { attachment: Attachment; fileId: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = ((i + 1) / files.length) * 100;

    if (onProgress) {
      onProgress(progress, file.name);
    }

    const result = await uploadFileToCoze(file, acceptedTypes, maxSize);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

/**
 * 获取文件图标
 */
export function getFileIcon(contentType: string): string {
  // 图片文件
  if (contentType.startsWith('image/')) return '🖼️';

  // 音频文件
  if (contentType.startsWith('audio/')) return '🎵';

  // 视频文件
  if (contentType.startsWith('video/')) return '🎬';

  // 压缩文件
  if (
    contentType.includes('zip') ||
    contentType.includes('rar') ||
    contentType.includes('7z') ||
    contentType.includes('gzip') ||
    contentType.includes('bz2')
  )
    return '📦';

  // PDF文件
  if (contentType === 'application/pdf') return '📄';

  // Word文档
  if (contentType.includes('word') || contentType.includes('document'))
    return '📝';

  // Excel表格
  if (contentType.includes('excel') || contentType.includes('sheet'))
    return '📊';

  // PowerPoint演示文稿
  if (
    contentType.includes('powerpoint') ||
    contentType.includes('presentation')
  )
    return '📽️';

  // JSON文件
  if (contentType === 'application/json') return '🔧';

  // 代码文件
  if (
    contentType.includes('javascript') ||
    contentType.includes('python') ||
    contentType.includes('java') ||
    contentType.includes('cpp') ||
    contentType.includes('c')
  )
    return '💻';

  // 文本文件
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

/**
 * 生成文件类型的accept字符串
 */
export function generateAcceptString(acceptedTypes?: string[]): string {
  if (!acceptedTypes || acceptedTypes.length === 0) {
    return FILE_TYPE_GROUPS.all.mimeTypes.join(',');
  }
  return acceptedTypes.join(',');
}
