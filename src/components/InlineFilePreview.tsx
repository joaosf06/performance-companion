import { FileText, Download, Paperclip } from "lucide-react";

interface InlineFilePreviewProps {
  url: string;
  name?: string;
  mimeType?: string | null;
  className?: string;
  maxHeight?: string;
}

const guessTypeFromName = (name?: string): string | null => {
  if (!name) return null;
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)) return `image/${ext === "jpg" ? "jpeg" : ext}`;
  if (["mp4", "webm", "mov", "ogg"].includes(ext)) return `video/${ext}`;
  if (["mp3", "wav", "m4a"].includes(ext)) return `audio/${ext}`;
  if (ext === "pdf") return "application/pdf";
  return null;
};

const InlineFilePreview = ({ url, name, mimeType, className = "", maxHeight = "max-h-[60vh]" }: InlineFilePreviewProps) => {
  const type = mimeType || guessTypeFromName(name);
  const displayName = name || url.split("/").pop() || "Ficheiro";

  if (type?.startsWith("image")) {
    return (
      <figure className={`space-y-1 ${className}`}>
        <img
          src={url}
          alt={displayName}
          className={`w-full ${maxHeight} object-contain rounded-md border border-border bg-secondary/30`}
          loading="lazy"
        />
        {name && <figcaption className="text-xs text-muted-foreground truncate">{displayName}</figcaption>}
      </figure>
    );
  }

  if (type?.startsWith("video")) {
    return (
      <div className={`space-y-1 ${className}`}>
        <video src={url} controls className={`w-full ${maxHeight} rounded-md bg-black`} preload="metadata" />
        {name && <p className="text-xs text-muted-foreground truncate">{displayName}</p>}
      </div>
    );
  }

  if (type?.startsWith("audio")) {
    return (
      <div className={`space-y-1 ${className}`}>
        <audio src={url} controls className="w-full" />
        {name && <p className="text-xs text-muted-foreground truncate">{displayName}</p>}
      </div>
    );
  }

  if (type === "application/pdf") {
    return (
      <div className={`space-y-1 ${className}`}>
        <iframe src={url} title={displayName} className={`w-full ${maxHeight} min-h-[400px] rounded-md border border-border bg-background`} />
        {name && <p className="text-xs text-muted-foreground truncate">{displayName}</p>}
      </div>
    );
  }

  // Fallback for unknown / non-previewable types
  return (
    <div className={`flex items-center gap-3 rounded-md border border-border bg-secondary/40 p-3 ${className}`}>
      <FileText className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{displayName}</p>
        <p className="text-xs text-muted-foreground">{type || "Ficheiro"}</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Abrir
      </a>
      <a
        href={url}
        download={displayName}
        className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-secondary transition-colors inline-flex items-center gap-1"
      >
        <Download className="h-3 w-3" />
        Descarregar
      </a>
    </div>
  );
};

export default InlineFilePreview;
export { guessTypeFromName };
