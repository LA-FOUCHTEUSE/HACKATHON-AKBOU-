// Campaign times are entered and displayed in Algeria time (UTC+1 all year, no DST),
// independently of the device or server time zone.
const ALGIERS_OFFSET = "+01:00";

/** Date -> "YYYY-MM-DDTHH:mm" for <input type="datetime-local">, in Algeria time. */
export function toAlgiersInput(date: Date | string): string {
  const d = new Date(new Date(date).getTime() + 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

/** "YYYY-MM-DDTHH:mm" entered in Algeria time -> ISO string (UTC). */
export function fromAlgiersInput(value: string): string {
  if (!value) return value;
  const d = new Date(`${value}:00${ALGIERS_OFFSET}`);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

/** Default slot for a new campaign form: in 7 days, 09:00 to 13:00 Algeria time. */
export function defaultCampaignSlot(): { startAt: string; endAt: string } {
  const start = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  start.setUTCHours(8, 0, 0, 0);
  return { startAt: toAlgiersInput(start), endAt: toAlgiersInput(new Date(start.getTime() + 4 * 3600 * 1000)) };
}
