'use client';

import { useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { cropImageToJpeg } from '@/app/core/utils/cropImage';
import Button from '@/components/ui/atoms/Button';
import Select from '@/components/ui/atoms/Select';
import InlineAlert from '@/components/ui/molecules/InlineAlert';
import styles from './ImageCropper.module.css';

interface ImageCropperProps {
  imageUrl: string;
  fileName: string;
  onApply: (file: File) => void;
  onCancel: () => void;
}

const ASPECT_OPTIONS = [
  { value: '1', label: '1:1 (square)' },
  { value: String(4 / 3), label: '4:3' },
  { value: String(16 / 9), label: '16:9' },
];

export default function ImageCropper({ imageUrl, fileName, onApply, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState('1');
  const [area, setArea] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async () => {
    if (!area) return;
    setApplying(true);
    setError(null);
    try {
      onApply(await cropImageToJpeg(imageUrl, area, fileName));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The image could not be cropped.');
      setApplying(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.stage}>
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={Number(aspect)}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setArea(pixels)}
        />
      </div>

      <div className={styles.controls}>
        <label className={styles.zoom}>
          <span className={styles.zoomLabel}>Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            aria-label="Zoom"
          />
        </label>
        <Select
          id="crop-aspect"
          label="Aspect ratio"
          options={ASPECT_OPTIONS}
          value={aspect}
          onChange={(event) => setAspect(event.target.value)}
        />
      </div>

      <p className={styles.hint}>The cropped image is saved as a JPEG.</p>
      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={applying}>
          Cancel
        </Button>
        <Button type="button" variant="primary" onClick={apply} disabled={applying || !area}>
          {applying ? 'Cropping…' : 'Apply crop'}
        </Button>
      </div>
    </div>
  );
}
