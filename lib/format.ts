/**
 * Vercel's servers run in UTC, so anything formatted without an explicit zone
 * renders an hour behind British summer time and reads as though the page has
 * frozen. Every genuine instant is formatted in this zone.
 *
 * Weather times are the exception: Open-Meteo returns local wall-clock strings
 * with no offset, so converting them would shift them again.
 */
export const SITE_TIME_ZONE = "Europe/London";

/** Clock time for an instant, in the site's zone. */
export function clockTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SITE_TIME_ZONE,
  });
}

/** Shared formatting, kept server-safe so both boundaries can use it. */
export function relativeDate(iso: string) {
  const then = new Date(iso);
  const hours = (Date.now() - then.getTime()) / 3_600_000;
  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: SITE_TIME_ZONE,
  });
}
