import UploadButton, { UploadButtonProps } from '@/components/upload-button';
import { FILE_TYPE_GROUPS } from '@/lib/utils/coze-file-upload';

export type ImageUploadButtonProps = UploadButtonProps;

export default function ImageUploadButton(props: ImageUploadButtonProps) {
  // 预配置为只接受图片格式
  const imageAcceptedTypes = FILE_TYPE_GROUPS.images.mimeTypes;

  return <UploadButton {...props} acceptedFileTypes={imageAcceptedTypes} />;
}
