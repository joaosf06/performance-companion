import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import { listSiteAssets, type SiteAsset } from "@/lib/siteAssets";
import { toast } from "sonner";

interface BucketAssetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: { url: string; name: string }) => void;
  onlyImages?: boolean;
}

const BucketAssetPicker = ({
  open,
  onOpenChange,
  onSelect,
  onlyImages = true,
}: BucketAssetPickerProps) => {
  const [assets, setAssets] = useState<SiteAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setAssets(await listSiteAssets(onlyImages));
    } catch {
      toast.error("Não foi possível carregar as fotos guardadas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onlyImages]);

  const visible = assets.filter((a) =>
    a.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const pick = (asset: SiteAsset) => {
    onSelect({ url: asset.url, name: asset.name });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{onlyImages ? "Fotos guardadas" : "Ficheiros guardados"}</DialogTitle>
          <DialogDescription>
            Escolhe {onlyImages ? "uma foto" : "um ficheiro"} que já carregaste para o site.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Procurar por nome..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button variant="outline" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Ainda não há {onlyImages ? "fotos" : "ficheiros"} guardados.
          </p>
        ) : (
          <div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
            {visible.map((asset) => (
              <button
                key={asset.path}
                type="button"
                onClick={() => pick(asset)}
                className="group overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-primary"
              >
                <div className="flex aspect-square items-center justify-center bg-muted">
                  {asset.isImage ? (
                    <img
                      src={asset.url}
                      alt={asset.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <p className="truncate px-2 py-2 text-xs text-muted-foreground">{asset.name}</p>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BucketAssetPicker;
