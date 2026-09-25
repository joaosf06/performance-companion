import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";

interface SiteEditorBarProps {
  editing: boolean;
  saving: boolean;
  onStart: () => void;
  onCancel: () => void;
  onSave: () => void;
}

const SiteEditorBar = ({ editing, saving, onStart, onCancel, onSave }: SiteEditorBarProps) => (
  <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2">
    {editing ? (
      <div className="flex items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 shadow-xl backdrop-blur">
        <span className="hidden px-2 text-xs text-muted-foreground sm:inline">
          Clica nos textos para escrever · arrasta as fotos para posicionar
        </span>
        <Button size="sm" variant="ghost" className="gap-1" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4" /> Cancelar
        </Button>
        <Button size="sm" className="gap-1" onClick={onSave} disabled={saving}>
          <Check className="h-4 w-4" /> {saving ? "A guardar..." : "Guardar"}
        </Button>
      </div>
    ) : (
      <Button
        size="sm"
        variant="outline"
        className="gap-2 rounded-full bg-background/90 shadow-lg backdrop-blur"
        onClick={onStart}
      >
        <Pencil className="h-4 w-4" /> Editar página
      </Button>
    )}
  </div>
);

export default SiteEditorBar;
