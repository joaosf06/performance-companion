import { useRef, useState } from "react";

export type Framing = { x: number; y: number; zoom: number };

interface AdjustableImageProps {
  src: string;
  alt: string;
  framing: Framing;
  editable?: boolean;
  onChange?: (framing: Framing) => void;
  className?: string;
}

const clamp = (v: number) => Math.min(100, Math.max(0, v));

const AdjustableImage = ({
  src,
  alt,
  framing,
  editable = false,
  onChange,
  className = "",
}: AdjustableImageProps) => {
  const ref = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!editable) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    start.current = { px: e.clientX, py: e.clientY, x: framing.x, y: framing.y };
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!editable || !dragging || !start.current || !onChange) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = ((e.clientX - start.current.px) / rect.width) * 100;
    const dy = ((e.clientY - start.current.py) / rect.height) * 100;
    onChange({
      ...framing,
      x: clamp(start.current.x - dx),
      y: clamp(start.current.y - dy),
    });
  };

  const handlePointerUp = () => {
    start.current = null;
    setDragging(false);
  };

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      fetchPriority="high"
      decoding="async"
      draggable={false}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        objectPosition: `${framing.x}% ${framing.y}%`,
        transform: `scale(${framing.zoom / 100})`,
      }}
      className={`${className} ${
        editable ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""
      } ${editable ? "ring-2 ring-primary/60 ring-inset" : ""} select-none touch-none`}
    />
  );
};

export default AdjustableImage;
