import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Target,
  Users,
  TrendingUp,
  Brain,
  ChevronRight,
  Star,
  Shield,
  Zap,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  FileText,
  Download,
} from "lucide-react";
import SocialLinks from "@/components/SocialLinks";
import logoPrime11 from "@/assets/logo-prime11.png.asset.json";
import EditableText from "@/components/site-editor/EditableText";
import ImageField from "@/components/site-editor/ImageField";
import SiteEditorBar from "@/components/site-editor/SiteEditorBar";
import { uploadSiteAsset } from "@/lib/siteAssets";
import {
  useSiteContent,
  DEFAULT_HOME_CONTENT,
  type HomeContent,
  type TextAlign,
} from "@/hooks/useSiteContent";
import { toast } from "sonner";

const aboutIcons = [Target, Star, Shield];
const serviceIcons = [TrendingUp, Brain, Users, Zap];

const alignClass: Record<TextAlign, string> = {
  left: "text-center lg:text-left",
  center: "text-center",
  right: "text-center lg:text-right",
};
const alignItems: Record<TextAlign, string> = {
  left: "sm:justify-center lg:justify-start",
  center: "sm:justify-center",
  right: "sm:justify-center lg:justify-end",
};

const Index = () => {
  const { user, role } = useAuth();
  const canEdit = role === "coach";
  const { content, setContent, save } = useSiteContent();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snapshot, setSnapshot] = useState<HomeContent | null>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const docInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof HomeContent>(key: K, value: HomeContent[K]) =>
    setContent({ ...content, [key]: value });

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(content);
      toast.success("Página atualizada");
      setEditing(false);
      setSnapshot(null);
    } catch {
      toast.error("Não foi possível guardar as alterações");
    } finally {
      setSaving(false);
    }
  };

  const addGalleryPhoto = async (file?: File | null) => {
    if (!file) return;
    try {
      const url = await uploadSiteAsset(file);
      set("gallery", [...content.gallery, { url, caption: "", x: 50, y: 50, zoom: 100 }]);
      toast.success("Foto adicionada");
    } catch {
      toast.error("Não foi possível carregar a foto");
    }
  };

  const addDocument = async (file?: File | null) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("O ficheiro não pode exceder 50 MB");
      return;
    }
    try {
      const url = await uploadSiteAsset(file);
      set("files", [...content.files, { name: file.name, url }]);
      toast.success("Ficheiro adicionado");
    } catch {
      toast.error("Não foi possível carregar o ficheiro");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center">
            <img src={logoPrime11.url} alt="Prime11" className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <a href="#sobre" className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:inline-block">Sobre</a>
            <a href="#servicos" className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:inline-block">Serviços</a>
            <a href="#equipa" className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:inline-block">Equipa</a>
            {user ? (
              <Link to="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="sm">Entrar</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden px-6 pt-24 pb-16">
        <div className="absolute inset-0">
          <ImageField
            value={content.heroBg}
            editing={editing}
            onChange={(v) => set("heroBg", v)}
            alt="Treino Prime11"
            controlsClassName="left-4 top-20"
          />
          <div className={`absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40 ${editing ? "pointer-events-none opacity-40" : ""}`} />
          <div className={`absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/70 ${editing ? "pointer-events-none opacity-40" : ""}`} />
          <div className="pointer-events-none absolute left-1/4 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <div className={`animate-fade-in ${alignClass[content.heroAlign]}`}>
            {editing && (
              <div className="mb-4 inline-flex gap-1 rounded-lg border border-border bg-background/95 p-1">
                {([
                  ["left", AlignLeft],
                  ["center", AlignCenter],
                  ["right", AlignRight],
                ] as const).map(([value, Icon]) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={content.heroAlign === value ? "default" : "ghost"}
                    className="h-8 w-8 p-0"
                    onClick={() => set("heroAlign", value)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            )}

            <EditableText
              as="span"
              editing={editing}
              value={content.heroBadge}
              onChange={(v) => set("heroBadge", v)}
              className="mb-6 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary backdrop-blur-sm"
            />

            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              <EditableText
                editing={editing}
                value={content.heroTitle}
                onChange={(v) => set("heroTitle", v)}
              />{" "}
              <EditableText
                editing={editing}
                value={content.heroTitleAccent}
                onChange={(v) => set("heroTitleAccent", v)}
                className="text-primary"
              />
            </h1>

            <EditableText
              as="p"
              editing={editing}
              value={content.heroSubtitle}
              onChange={(v) => set("heroSubtitle", v)}
              className={`mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl ${content.heroAlign === "right" ? "lg:ml-auto mx-auto" : "mx-auto lg:mx-0"}`}
            />

            <div className={`mt-10 flex flex-col items-center gap-4 sm:flex-row ${alignItems[content.heroAlign]}`}>
              <Link to="/treino-gratis">
                <Button size="lg" className="gap-2 text-base px-8">
                  <EditableText
                    editing={editing}
                    value={content.heroPrimaryCta}
                    onChange={(v) => set("heroPrimaryCta", v)}
                  />
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="text-base px-8 bg-background/40 backdrop-blur-sm">
                  <EditableText
                    editing={editing}
                    value={content.heroSecondaryCta}
                    onChange={(v) => set("heroSecondaryCta", v)}
                  />
                </Button>
              </Link>
            </div>
          </div>

          {/* Framed photo card */}
          <div className="relative hidden lg:block animate-fade-in">
            <div className="absolute -inset-4 rounded-[2rem] bg-primary/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl">
              <ImageField
                value={content.heroCard}
                editing={editing}
                onChange={(v) => set("heroCard", v)}
                alt="Atleta em treino individual Prime11"
                className="aspect-[4/5] w-full object-cover"
                controlsClassName="left-3 top-3"
              />
              <div className={`absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent ${editing ? "pointer-events-none opacity-30" : ""}`} />
            </div>
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="border-t border-border/50 py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <EditableText
              editing={editing}
              value={content.aboutEyebrow}
              onChange={(v) => set("aboutEyebrow", v)}
              className="text-xs font-medium uppercase tracking-widest text-primary"
            />
            <EditableText
              as="h2"
              editing={editing}
              value={content.aboutTitle}
              onChange={(v) => set("aboutTitle", v)}
              className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
            />
            <EditableText
              as="p"
              editing={editing}
              value={content.aboutText}
              onChange={(v) => set("aboutText", v)}
              multiline
              className="mt-4 text-muted-foreground text-lg"
            />
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {content.aboutCards.map((item, i) => {
              const Icon = aboutIcons[i % aboutIcons.length];
              return (
                <div
                  key={i}
                  className="group rounded-xl border border-border/50 bg-card p-8 transition-all hover:border-primary/30"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <EditableText
                    as="h3"
                    editing={editing}
                    value={item.title}
                    onChange={(v) =>
                      set(
                        "aboutCards",
                        content.aboutCards.map((c, j) => (j === i ? { ...c, title: v } : c)),
                      )
                    }
                    className="text-lg font-semibold text-foreground"
                  />
                  <EditableText
                    as="p"
                    editing={editing}
                    value={item.description}
                    onChange={(v) =>
                      set(
                        "aboutCards",
                        content.aboutCards.map((c, j) => (j === i ? { ...c, description: v } : c)),
                      )
                    }
                    multiline
                    className="mt-2 text-sm text-muted-foreground leading-relaxed"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="border-t border-border/50 bg-card/50 py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <EditableText
              editing={editing}
              value={content.servicesEyebrow}
              onChange={(v) => set("servicesEyebrow", v)}
              className="text-xs font-medium uppercase tracking-widest text-primary"
            />
            <EditableText
              as="h2"
              editing={editing}
              value={content.servicesTitle}
              onChange={(v) => set("servicesTitle", v)}
              className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
            />
            <EditableText
              as="p"
              editing={editing}
              value={content.servicesSubtitle}
              onChange={(v) => set("servicesSubtitle", v)}
              className="mt-4 text-muted-foreground text-lg"
            />
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {content.serviceCards.map((item, i) => {
              const Icon = serviceIcons[i % serviceIcons.length];
              return (
                <div
                  key={i}
                  className="rounded-xl border border-border/50 bg-background p-8 transition-all hover:border-primary/30"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <EditableText
                    as="h3"
                    editing={editing}
                    value={item.title}
                    onChange={(v) =>
                      set(
                        "serviceCards",
                        content.serviceCards.map((c, j) => (j === i ? { ...c, title: v } : c)),
                      )
                    }
                    className="text-lg font-semibold text-foreground"
                  />
                  <EditableText
                    as="p"
                    editing={editing}
                    value={item.description}
                    onChange={(v) =>
                      set(
                        "serviceCards",
                        content.serviceCards.map((c, j) => (j === i ? { ...c, description: v } : c)),
                      )
                    }
                    multiline
                    className="mt-3 text-sm text-muted-foreground leading-relaxed"
                  />
                  {editing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-3 gap-1 text-destructive"
                      onClick={() =>
                        set("serviceCards", content.serviceCards.filter((_, j) => j !== i))
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remover
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {editing && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() =>
                  set("serviceCards", [
                    ...content.serviceCards,
                    { title: "Novo serviço", description: "Descrição do serviço." },
                  ])
                }
              >
                <Plus className="h-4 w-4" /> Adicionar serviço
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Equipa */}
      <section id="equipa" className="border-t border-border/50 py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <EditableText
              editing={editing}
              value={content.teamEyebrow}
              onChange={(v) => set("teamEyebrow", v)}
              className="text-xs font-medium uppercase tracking-widest text-primary"
            />
            <EditableText
              as="h2"
              editing={editing}
              value={content.teamTitle}
              onChange={(v) => set("teamTitle", v)}
              className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
            />
            <EditableText
              as="p"
              editing={editing}
              value={content.teamSubtitle}
              onChange={(v) => set("teamSubtitle", v)}
              className="mt-4 text-muted-foreground text-lg"
            />
          </div>

          <div className="mt-16 mx-auto max-w-3xl rounded-xl border border-border/50 bg-card p-10 text-center">
            <EditableText
              as="p"
              editing={editing}
              value={content.teamText}
              onChange={(v) => set("teamText", v)}
              multiline
              className="text-muted-foreground leading-relaxed text-base"
            />
          </div>
        </div>
      </section>

      {/* Galeria */}
      {(editing || content.gallery.length > 0) && (
        <section className="border-t border-border/50 bg-card/50 py-24 px-6">
          <div className="mx-auto max-w-6xl">
            <EditableText
              as="h2"
              editing={editing}
              value={content.galleryTitle}
              onChange={(v) => set("galleryTitle", v)}
              className="text-center text-3xl font-bold tracking-tight sm:text-4xl"
            />

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {content.gallery.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="relative overflow-hidden rounded-xl border border-border/50">
                    <ImageField
                      value={item}
                      editing={editing}
                      onChange={(v) =>
                        set(
                          "gallery",
                          content.gallery.map((g, j) => (j === i ? { ...g, ...v } : g)),
                        )
                      }
                      alt={item.caption || "Foto Prime11"}
                      className="aspect-[4/3] w-full object-cover"
                      controlsClassName="left-2 top-2"
                    />
                  </div>
                  {(editing || item.caption) && (
                    <EditableText
                      as="p"
                      editing={editing}
                      value={item.caption || "Legenda"}
                      onChange={(v) =>
                        set(
                          "gallery",
                          content.gallery.map((g, j) => (j === i ? { ...g, caption: v } : g)),
                        )
                      }
                      className="text-center text-sm text-muted-foreground"
                    />
                  )}
                  {editing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full gap-1 text-destructive"
                      onClick={() => set("gallery", content.gallery.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remover foto
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {editing && (
              <div className="mt-8 text-center">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => galleryInput.current?.click()}>
                  <Plus className="h-4 w-4" /> Adicionar foto
                </Button>
                <input
                  ref={galleryInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    addGalleryPhoto(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Ficheiros */}
      {(editing || content.files.length > 0) && (
        <section className="border-t border-border/50 py-24 px-6">
          <div className="mx-auto max-w-3xl">
            <EditableText
              as="h2"
              editing={editing}
              value={content.filesTitle}
              onChange={(v) => set("filesTitle", v)}
              className="text-center text-3xl font-bold tracking-tight sm:text-4xl"
            />

            <div className="mt-10 space-y-3">
              {content.files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4"
                >
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <EditableText
                    editing={editing}
                    value={file.name}
                    onChange={(v) =>
                      set("files", content.files.map((f, j) => (j === i ? { ...f, name: v } : f)))
                    }
                    className="flex-1 truncate text-sm"
                  />
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1">
                      <Download className="h-3.5 w-3.5" /> Abrir
                    </Button>
                  </a>
                  {editing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => set("files", content.files.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {editing && (
              <div className="mt-6 text-center">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => docInput.current?.click()}>
                  <Plus className="h-4 w-4" /> Adicionar ficheiro
                </Button>
                <input
                  ref={docInput}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    addDocument(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Final */}
      <section className="border-t border-border/50 bg-card/50 py-24 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <EditableText
            as="h2"
            editing={editing}
            value={content.ctaTitle}
            onChange={(v) => set("ctaTitle", v)}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          />
          <EditableText
            as="p"
            editing={editing}
            value={content.ctaSubtitle}
            onChange={(v) => set("ctaSubtitle", v)}
            className="mt-4 text-muted-foreground text-lg"
          />
          <div className="mt-8">
            <Link to="/auth">
              <Button size="lg" className="gap-2 text-base px-10">
                <EditableText
                  editing={editing}
                  value={content.ctaButton}
                  onChange={(v) => set("ctaButton", v)}
                />
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <img src={logoPrime11.url} alt="Prime11" className="h-10 w-auto" />
          <SocialLinks />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Prime11. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {canEdit && (
        <SiteEditorBar
          editing={editing}
          saving={saving}
          onStart={() => {
            setSnapshot(content);
            setEditing(true);
          }}
          onCancel={() => {
            if (snapshot) setContent(snapshot);
            setEditing(false);
            setSnapshot(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Index;
