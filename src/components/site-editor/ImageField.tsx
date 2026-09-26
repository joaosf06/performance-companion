import { useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Upload, Move } from "lucide-react";
import { toast } from "sonner";
import AdjustableImage from "@/components/AdjustableImage";
import { uploadSiteAsset } from "@/lib/siteAssets";
import type { ImageContent } from "@/hooks/useSiteContent";

interface ImageFieldProps {
  value: ImageContent;
  editing: boolean;
  onChange: (value: ImageContent) => void;
  alt: string;
  className?: string;
  controlsClassName?: string;
}

const ImageField = ({
  value,
  editing,
  onChange,
  alt,
  className = "h-full w-full object-cover",
  controlsClassName = "left-4 top-4",
}: ImageFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("A foto não pode exceder 20 MB");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadSiteAsset(file);
      onChange({ ...value, url });
      toast.success("Foto carregada");
    } catch {
      toast.error("Não foi possível carregar a foto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <AdjustableImage
        src={value.url}
        alt={alt}
        framing={{ x: value.x, y: value.y, zoom: value.zoom }}
        editable={editing}
        onChange={(f) => onChange({ ...value, x: f.x, y: f.y, zoom: f.zoom })}
        className={className}
      />
      {editing && (
        <div
          className={`absolute z-30 w-60 space-y-3 rounded-xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur ${controlsClassName}`}
        >
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Move className="h-3.5 w-3.5" /> Arrasta a foto para posicionar
          </p>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Horizontal {Math.round(value.x)}%</p>
            <Slider
              value={[value.x]}
              min={0}
              max={100}
              step={1}
              onValueChange={([x]) => onChange({ ...value, x })}
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Vertical {Math.round(value.y)}%</p>
            <Slider
              value={[value.y]}
              min={0}
              max={100}
              step={1}
              onValueChange={([y]) => onChange({ ...value, y })}
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Zoom {value.zoom}%</p>
            <Slider
              value={[value.zoom]}
              min={100}
              max={250}
              step={1}
              onValueChange={([zoom]) => onChange({ ...value, zoom })}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" /> {uploading ? "A carregar..." : "Trocar foto"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </>
  );
};

export default ImageField;
