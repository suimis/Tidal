import { useRef } from 'react';
import html2canvas, { Options } from 'html2canvas-pro';

const useMarkdownToImage = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const convertToImage = (options: Partial<Options> = {}) => {
    if (containerRef.current) {
      return html2canvas(containerRef.current, options).then((canvas) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return canvas.toDataURL((options as any).type || 'image/png');
      });
    } else {
      return Promise.reject('Container not found');
    }
  };

  return { containerRef, convertToImage };
};

export default useMarkdownToImage;
