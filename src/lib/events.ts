export type FormField = { id: string; label: string; type: "text" | "email" | "tel" | "number" | "textarea"; required: boolean };
export type EventBlock =
  | { id: string; type: "text"; title: string; body: string }
  | { id: string; type: "image"; url: string; caption: string }
  | { id: string; type: "video"; url: string; caption: string }
  | { id: string; type: "form"; title: string; fields: FormField[]; button: string }
  | { id: string; type: "table"; title: string; headers: string[]; rows: string[][] }
  | { id: string; type: "scorers"; title: string; rows: { name: string; team: string; goals: number }[] }
  | { id: string; type: "matches"; title: string; rows: { date: string; home: string; away: string; homeScore: string; awayScore: string }[] };

export type EventRow = {
  id: string; slug: string; title: string; subtitle: string | null; cover_url: string | null;
  published: boolean; blocks: EventBlock[];
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const BLOCK_LABELS: Record<EventBlock["type"], string> = {
  text: "Texto", image: "Foto", video: "Vídeo", form: "Formulário de inscrição",
  table: "Tabela / Classificação", scorers: "Marcadores", matches: "Jogos e resultados",
};

export const newBlock = (type: EventBlock["type"]): EventBlock => {
  const id = uid();
  switch (type) {
    case "text": return { id, type, title: "Título", body: "Escreve aqui o texto." };
    case "image": return { id, type, url: "", caption: "" };
    case "video": return { id, type, url: "", caption: "" };
    case "form": return { id, type, title: "Inscrição", button: "Inscrever", fields: [
      { id: uid(), label: "Nome completo", type: "text", required: true },
      { id: uid(), label: "Email", type: "email", required: true },
      { id: uid(), label: "Telemóvel", type: "tel", required: false },
    ] };
    case "table": return { id, type, title: "Classificação", headers: ["Equipa", "J", "Pts"], rows: [["Equipa A", "0", "0"]] };
    case "scorers": return { id, type, title: "Melhores marcadores", rows: [{ name: "Jogador", team: "Equipa", goals: 0 }] };
    case "matches": return { id, type, title: "Jogos", rows: [{ date: "", home: "Equipa A", away: "Equipa B", homeScore: "", awayScore: "" }] };
  }
};

export const videoEmbed = (url: string): string | null => {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
};
