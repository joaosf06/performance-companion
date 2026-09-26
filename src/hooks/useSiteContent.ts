import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ImageContent = { url: string; x: number; y: number; zoom: number };
export type CardContent = { title: string; description: string };
export type GalleryItem = { url: string; caption: string; x: number; y: number; zoom: number };
export type FileItem = { name: string; url: string };
export type TextAlign = "left" | "center" | "right";

export type HomeContent = {
  heroBadge: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroAlign: TextAlign;
  heroBg: ImageContent;
  heroCard: ImageContent;
  aboutEyebrow: string;
  aboutTitle: string;
  aboutText: string;
  aboutCards: CardContent[];
  servicesEyebrow: string;
  servicesTitle: string;
  servicesSubtitle: string;
  serviceCards: CardContent[];
  teamEyebrow: string;
  teamTitle: string;
  teamSubtitle: string;
  teamText: string;
  galleryTitle: string;
  gallery: GalleryItem[];
  filesTitle: string;
  files: FileItem[];
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButton: string;
};

const HERO_IMAGE =
  "https://nbiwobyvwdtrchqzgrix.supabase.co/storage/v1/object/public/site-assets/IMG_5656.jpeg";

export const DEFAULT_HOME_CONTENT: HomeContent = {
  heroBadge: "Treino Individual de Elite",
  heroTitle: "O teu rendimento.",
  heroTitleAccent: "Sem limites.",
  heroSubtitle:
    "A Prime11 conecta jogadores e treinadores numa plataforma de acompanhamento personalizado. Monitoriza, evolui e atinge o teu máximo potencial.",
  heroPrimaryCta: "Treino grátis",
  heroSecondaryCta: "Criar conta",
  heroAlign: "left",
  heroBg: { url: HERO_IMAGE, x: 50, y: 50, zoom: 105 },
  heroCard: { url: HERO_IMAGE, x: 50, y: 50, zoom: 100 },
  aboutEyebrow: "Quem somos",
  aboutTitle: "Treinadores e jogadores, juntos.",
  aboutText:
    "A Prime11 nasceu da necessidade de profissionalizar e individualizar o acompanhamento aos jogadores no futebol. Acreditamos que cada atleta merece um plano personalizado, dados concretos e comunicação direta com o seu treinador.",
  aboutCards: [
    {
      title: "Missão",
      description:
        "Profissionalismo, excelência, transparência e compromisso com a evolução de cada atleta.",
    },
    {
      title: "Visão",
      description:
        "Ser a plataforma de referência em Portugal para treino individual e monitorização de atletas.",
    },
    {
      title: "Valores",
      description:
        "Transparência, excelência, personalização e compromisso com a evolução de cada atleta.",
    },
  ],
  servicesEyebrow: "Serviços",
  servicesTitle: "O que oferecemos",
  servicesSubtitle: "Ferramentas profissionais para maximizar o potencial de cada atleta.",
  serviceCards: [
    {
      title: "Relatórios de Treino Detalhados",
      description:
        "Cada treino com objetivos, pontos fortes, aspetos a melhorar e avaliação técnica e mental.",
    },
    {
      title: "Monitorização Semanal",
      description:
        "Questionários semanais sobre fadiga, sono, motivação e confiança. Dados essenciais para ajustar o plano de treino.",
    },
    {
      title: "Gestão de Atletas",
      description:
        "O treinador gere a sua carteira de atletas, com acesso ao histórico completo de cada jogador — relatórios, questionários e evolução.",
    },
    {
      title: "Dashboard Personalizado",
      description:
        "Cada utilizador tem um painel adaptado ao seu perfil. Jogadores veem os seus dados; treinadores gerem a sua equipa.",
    },
  ],
  teamEyebrow: "Equipa",
  teamTitle: "Quem está por trás da Prime11",
  teamSubtitle:
    "Uma equipa apaixonada por futebol e tecnologia, comprometida em transformar o treino individual.",
  teamText:
    "A Prime 11 nasceu da necessidade de criar um ambiente de desenvolvimento verdadeiramente focado no atleta.\n\nNum contexto onde muitos jogadores treinam sem acompanhamento individual, estrutura ou feedback contínuo, a Prime 11 surge com uma abordagem baseada em metodologia, exigência e evolução constante. Um dos nossos objetivos é criar uma ponte entre jogadores e treinadores de forma a que a evolução seja o mais eficaz possível.\n\nMais do que treinos, procuramos oferecer um sistema de desenvolvimento físico, técnico e mental, onde cada atleta é acompanhado de forma individual para atingir o seu máximo potencial através de acesso a dados, relatórios e comunicação contínua.",
  galleryTitle: "Galeria",
  gallery: [],
  filesTitle: "Documentos",
  files: [],
  ctaTitle: "Pronto para evoluir?",
  ctaSubtitle: "Junta-te à Prime11 e leva o teu treino ao próximo nível.",
  ctaButton: "Criar conta",
};

const SETTING_KEY = "home_content";

const merge = (raw: unknown): HomeContent => {
  const v = (raw ?? {}) as Partial<HomeContent>;
  return {
    ...DEFAULT_HOME_CONTENT,
    ...v,
    heroBg: { ...DEFAULT_HOME_CONTENT.heroBg, ...(v.heroBg ?? {}) },
    heroCard: { ...DEFAULT_HOME_CONTENT.heroCard, ...(v.heroCard ?? {}) },
    aboutCards: v.aboutCards?.length ? v.aboutCards : DEFAULT_HOME_CONTENT.aboutCards,
    serviceCards: v.serviceCards?.length ? v.serviceCards : DEFAULT_HOME_CONTENT.serviceCards,
    gallery: v.gallery ?? [],
    files: v.files ?? [],
  };
};

export const useSiteContent = () => {
  const [content, setContent] = useState<HomeContent>(DEFAULT_HOME_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", SETTING_KEY)
        .maybeSingle();
      if (!mounted) return;
      if (data?.value) setContent(merge(data.value));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const save = useCallback(async (next: HomeContent) => {
    const { error } = await supabase.from("site_settings").upsert({
      key: SETTING_KEY,
      value: next as unknown as import("@/integrations/supabase/types").Json,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }, []);

  return { content, setContent, loading, save };
};
