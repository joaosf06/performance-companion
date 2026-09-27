import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImagePlus, Images, Upload, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import BucketAssetPicker from "@/components/site-editor/BucketAssetPicker";
import { uploadSiteAsset } from "@/lib/siteAssets";
import {
  usePageBackground,
  DEFAULT_PAGE_BACKGROUND,
  type PageBackground as Bg,
} from "@/hooks/usePageBackground";

interface PageBackgroundProps {
  /** Unique key for this page, e.g. "auth" or "dashboard". */
  pageKey: string;
  /** Friendly page name shown in the editor dialog. */
  label?: string;
}

const PageBackground = ({ pageKey, label }: PageBackgroundProps) => {
  const { role } = useAuth();
  const canEdit = role === "coach";
  const { background, setBackground, save } = usePageBackground(pageKey);
  const [open, setOpen] = useState(false);
  const [picker, setPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState<Bg | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const active = open && draft ? draft : background;

  const startEditing = () => {
    setDraft(background ?? { ...DEFAULT_PAGE_BACKGROUND });
    setOpen(true);
  };

  const patch = (partial: Partial<Bg>) =>
    setDraft((prev) => ({ ...(prev ?? DEFAULT_PAGE_BACKGROUND), ...partial }));

  const handleUpload = async (file?: File | null) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("A foto não pode ter mais de 20 MB");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadSiteAsset(file);
      patch({ url });
    } catch {
      toast.error("Não foi possível carregar a foto");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await save(draft);
      setBackground(draft);
      setOpen(false);
      toast.success("Fundo guardado");
    } catch {
      toast.error("Não foi possível guardar o fundo");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await save(null);
      setBackground(null);
      setDraft(null);
      setOpen(false);
      toast.success("Fundo removido");
    } catch {
      toast.error("Não foi possível remover o fundo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {active?.url && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          <img
            src={active.url}
            alt=""
            className="h-full w-full object-cover"
            style={{
              objectPosition: `${active.x}% ${active.y}%`,
              transform: `scale(${active.zoom / 100})`,
              transformOrigin: `${active.x}% ${active.y}%`,
              filter: `${active.grayscale ? "grayscale(1) " : ""}blur(${active.blur}px)`,
            }}
          />
          <div
            className="absolute inset-0 bg-background"
            style={{ opacity: active.overlay / 100 }}
          />
          {active.vignette && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 35%, hsl(var(--background)) 100%)",
              }}
            />
          )}
        </div>
      )}

      {canEdit && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={startEditing}
            className="fixed bottom-4 right-4 z-[60] gap-2 rounded-full bg-background/90 shadow-lg backdrop-blur"
          >
            <ImagePlus className="h-4 w-4" />
            <span className="hidden sm:inline">Fundo da página</span>
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Fundo{label ? ` — ${label}` : ""}</DialogTitle>
                <DialogDescription>
                  Escolhe uma foto e ajusta os efeitos. Só tu vês estes controlos.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="overflow-hidden rounded-lg border border-border bg-muted">
                  {draft?.url ? (
                    <div className="relative h-36 w-full">
                      <img
                        src={draft.url}
                        alt="Pré-visualização"
                        className="h-full w-full object-cover"
                        style={{
                          objectPosition: `${draft.x}% ${draft.y}%`,
                          transform: `scale(${draft.zoom / 100})`,
                          transformOrigin: `${draft.x}% ${draft.y}%`,
                          filter: `${draft.grayscale ? "grayscale(1) " : ""}blur(${draft.blur}px)`,
                        }}
                      />
                      <div
                        className="absolute inset-0 bg-background"
                        style={{ opacity: draft.overlay / 100 }}
                      />
                      {draft.vignette && (
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "radial-gradient(ellipse at center, transparent 35%, hsl(var(--background)) 100%)",
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <p className="p-8 text-center text-sm text-muted-foreground">
                      Sem foto de fundo
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setPicker(true)}>
                    <Images className="h-4 w-4" /> Fotos guardadas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInput.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Carregar foto
                  </Button>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      handleUpload(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Horizontal · {draft?.x ?? 50}%
                    </Label>
                    <Slider
                      value={[draft?.x ?? 50]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([v]) => patch({ x: v })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Vertical · {draft?.y ?? 50}%
                    </Label>
                    <Slider
                      value={[draft?.y ?? 50]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([v]) => patch({ y: v })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Zoom · {draft?.zoom ?? 100}%
                    </Label>
                    <Slider
                      value={[draft?.zoom ?? 100]}
                      min={100}
                      max={250}
                      step={1}
                      onValueChange={([v]) => patch({ zoom: v })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Escurecimento · {draft?.overlay ?? 65}%
                    </Label>
                    <Slider
                      value={[draft?.overlay ?? 65]}
                      min={0}
                      max={95}
                      step={1}
                      onValueChange={([v]) => patch({ overlay: v })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Desfoque · {draft?.blur ?? 0}px
                    </Label>
                    <Slider
                      value={[draft?.blur ?? 0]}
                      min={0}
                      max={16}
                      step={1}
                      onValueChange={([v]) => patch({ blur: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <Label className="text-sm">Preto e branco</Label>
                    <Switch
                      checked={draft?.grayscale ?? false}
                      onCheckedChange={(v) => patch({ grayscale: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <Label className="text-sm">Vinheta nas margens</Label>
                    <Switch
                      checked={draft?.vignette ?? true}
                      onCheckedChange={(v) => patch({ vignette: v })}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground"
                  onClick={handleRemove}
                  disabled={saving || !background}
                >
                  <Trash2 className="h-4 w-4" /> Remover fundo
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving || !draft?.url}>
                    {saving ? "A guardar..." : "Guardar"}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <BucketAssetPicker
            open={picker}
            onOpenChange={setPicker}
            onlyImages
            onSelect={({ url }) => patch({ url })}
          />
        </>
      )}
    </>
  );
};

export default PageBackground;
