import { addMinutes, format, parse } from "date-fns";

export type SlotInstance = {
  key: string; // `${dateISO}_${HH:mm}`
  dateISO: string; // yyyy-MM-dd
  startTime: string; // HH:mm:ss
  durationMinutes: number;
  capacity: number;
  source: "recurring" | "date";
  sourceId: string;
};

export type RecurringSlot = {
  id: string;
  weekday: number;
  start_time: string;
  duration_minutes: number;
  capacity: number;
  active: boolean;
};

export type DateSlot = {
  id: string;
  slot_date: string;
  start_time: string | null;
  duration_minutes: number | null;
  capacity: number | null;
  is_blocked: boolean;
  note: string | null;
};

export type Booking = {
  id: string;
  athlete_id: string;
  slot_date: string;
  start_time: string;
  duration_minutes: number;
  source: "recurring" | "date";
  source_id: string | null;
};

const normTime = (t: string) => (t.length === 5 ? `${t}:00` : t);

export const slotEndTime = (start: string, duration: number) => {
  const d = parse(normTime(start), "HH:mm:ss", new Date());
  return format(addMinutes(d, duration), "HH:mm");
};

export const formatTime = (t: string) => normTime(t).slice(0, 5);

/**
 * Build all slot instances for a date range using recurring rules + date-specific overrides/blocks.
 */
export function buildSlots(
  start: Date,
  end: Date,
  recurring: RecurringSlot[],
  dateSlots: DateSlot[],
): SlotInstance[] {
  // index date slots by date
  const fullDayBlocks = new Set(
    dateSlots.filter((d) => d.is_blocked && !d.start_time).map((d) => d.slot_date),
  );
  const slotBlocks = new Set(
    dateSlots.filter((d) => d.is_blocked && d.start_time).map((d) => `${d.slot_date}_${normTime(d.start_time!).slice(0, 5)}`),
  );

  const instances: SlotInstance[] = [];

  // iterate days
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);

  while (cur <= last) {
    const dateISO = format(cur, "yyyy-MM-dd");
    if (!fullDayBlocks.has(dateISO)) {
      const wd = cur.getDay();
      for (const r of recurring) {
        if (!r.active || r.weekday !== wd) continue;
        const hhmm = normTime(r.start_time).slice(0, 5);
        const key = `${dateISO}_${hhmm}`;
        if (slotBlocks.has(key)) continue;
        instances.push({
          key,
          dateISO,
          startTime: normTime(r.start_time),
          durationMinutes: r.duration_minutes,
          capacity: r.capacity,
          source: "recurring",
          sourceId: r.id,
        });
      }
    }
    cur.setDate(cur.getDate() + 1);
  }

  // add date-specific (non-blocked) slots
  for (const d of dateSlots) {
    if (d.is_blocked || !d.start_time) continue;
    const dt = parse(d.slot_date, "yyyy-MM-dd", new Date());
    if (dt < start || dt > end) continue;
    const hhmm = normTime(d.start_time).slice(0, 5);
    const key = `${d.slot_date}_${hhmm}`;
    // avoid duplicate if recurring already produced one — date-specific overrides
    const existingIdx = instances.findIndex((i) => i.key === key);
    if (existingIdx >= 0) instances.splice(existingIdx, 1);
    instances.push({
      key,
      dateISO: d.slot_date,
      startTime: normTime(d.start_time),
      durationMinutes: d.duration_minutes ?? 60,
      capacity: d.capacity ?? 1,
      source: "date",
      sourceId: d.id,
    });
  }

  instances.sort((a, b) => (a.dateISO === b.dateISO ? a.startTime.localeCompare(b.startTime) : a.dateISO.localeCompare(b.dateISO)));
  return instances;
}

export function bookingKey(b: { slot_date: string; start_time: string }) {
  return `${b.slot_date}_${normTime(b.start_time).slice(0, 5)}`;
}

export const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
