export const TRIAL_STATUSES = [
  { value: "novo", label: "Novo" },
  { value: "contactado", label: "Contactado" },
  { value: "agendado", label: "Agendado" },
  { value: "compareceu", label: "Compareceu" },
  { value: "nao_compareceu", label: "Não compareceu" },
  { value: "inscrito", label: "Inscrito" },
] as const;

/** Builds a wa.me number: digits only, +351 prefix when it is a 9-digit PT number. */
export const whatsappNumber = (phone: string | null | undefined): string | null => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return digits.length === 9 ? `351${digits}` : digits;
};
