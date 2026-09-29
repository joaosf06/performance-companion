import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Images, Upload, RotateCcw, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import BucketAssetPicker from "@/components/site-editor/BucketAssetPicker";
import { uploadSiteAsset } from "@/lib/siteAssets";
import {
  useSiteLogo,
  saveSiteLogo,
  setSiteLogoPreview,
  DEFAULT_SITE_LOGO,
  FALLBACK_LOGO_URL,
  type SiteLogo,
} from "@/hooks/useSiteLogo";

const LogoEditor = () => {
  const { role } = useAuth();
  const logo = useSiteLogo();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SiteLogo>(logo);
  const [snapshot, setSnapshot] = useState<SiteLogo>(logo);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (role !== "coach") return null;

  const update = (patch: Partial<SiteLogo>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    setSiteLogoPreview(next);
  };

  const start = () => {
    setDraft(logo);
    setSnapshot(logo);
    setOpen(true);
  };

  const cancel = () => {
    setSiteLogoPreview(snapshot);
    setOpen(false);
  };

  const upload = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) return toast.error("A imagem tem de ter até 20 MB");
    setBusy(true);
    try {
      update({ url: await uploadSiteAsset(file) });
    } catch {
      toast.error("Não foi possível carregar a imagem");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await saveSiteLogo(draft);
      toast.success("Logótipo guardado");
      setOpen(false);
    } catch {
      toast.error("Não foi possível guardar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="fixed bottom-16 right-4 z-[60] gap-2 rounded-full bg-background/90 shadow-lg backdrop-blur"
        onClick={start}
      >
        <Sparkles className="h-4 w-4" /> Logótipo
      </Button>

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : cancel())}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Logótipo</DialogTitle>
            <DialogDescription>
              Muda a imagem, o tamanho e a posição. Aplica-se em todas as páginas.
            </DialogDescription>
          </DialogHeader>

          <div className="flex h-24 items-center overflow-hidden rounded-lg border border-border bg-muted px-4">
            <img
              src={draft.url || FALLBACK_LOGO_URL}
              alt="Prime11"
              className="h-10 w-auto"
              style={{
                transform: `translate(${draft.x}px, ${draft.y}px) scale(${draft.size / 100})`,
                transformOrigin: "left center",
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setPicker(true)}>
              <Images className="h-4 w-4" /> Fotos guardadas
            </Button>
            <Button size="sm" variant="outline" className="gap-1" disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Carregar
            </Button>
            <Button size="sm" variant="ghost" className="gap-1" onClick={() => update(DEFAULT_SITE_LOGO)}>
              <RotateCcw className="h-4 w-4" /> Original
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
          </div>

          {([
            ["Tamanho", "size", 50, 250, "%"],
            ["Horizontal", "x", -100, 100, "px"],
            ["Vertical", "y", -30, 30, "px"],
          ] as const).map(([label, key, min, max, unit]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{label}</Label>
                <span className="text-muted-foreground">{draft[key]}{unit}</span>
              </div>
              <Slider min={min} max={max} step={1} value={[draft[key]]} onValueChange={([v]) => update({ [key]: v })} />
            </div>
          ))}

          <DialogFooter>
            <Button variant="ghost" onClick={cancel} disabled={busy}>Cancelar</Button>
            <Button onClick={save} disabled={busy}>{busy ? "A guardar..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BucketAssetPicker open={picker} onOpenChange={setPicker} onSelect={({ url }) => update({ url })} />
    </>
  );
};

export default LogoEditor;
