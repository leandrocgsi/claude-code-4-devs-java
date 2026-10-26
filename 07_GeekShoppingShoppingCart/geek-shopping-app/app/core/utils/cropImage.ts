export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const JPEG_QUALITY = 0.9;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The image could not be loaded.'));
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The image could not be converted.'))),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}

export function toJpegFileName(fileName: string): string {
  const baseName = fileName.replace(/\.[^./\\]+$/, '');
  return `${baseName || 'image'}.jpg`;
}

export async function cropImageToJpeg(imageUrl: string, area: CropArea, fileName: string): Promise<File> {
  const image = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(area.width));
  canvas.height = Math.max(1, Math.round(area.height));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image editing is not supported by this browser.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  const blob = await canvasToBlob(canvas);
  return new File([blob], toJpegFileName(fileName), { type: 'image/jpeg' });
}
