'use client';

import { ImgHTMLAttributes, useState } from 'react';

export const PLACEHOLDER_IMAGE = '/assets/no-image.jpg';

interface ProductImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt: string;
}

export default function ProductImage({ src, alt, ...rest }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolved = src && src !== failedSrc ? src : PLACEHOLDER_IMAGE;

  return <img src={resolved} alt={alt} onError={() => (src ? setFailedSrc(src) : undefined)} {...rest} />;
}
