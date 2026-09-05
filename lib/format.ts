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

/** Minutes east of UTC in the site's zone at a given instant. */
function zoneOffsetMinutes(at: Date) {
  const name = new Intl.DateTimeFormat("en-GB", {
    timeZone: SITE_TIME_ZONE,
    timeZoneName: "longOffset",
  })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value;
  const match = name?.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;
  return (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]));
}

/**
 * Midnight tonight-just-gone, in the site's zone rather than the server's.
 *
 * Vercel runs in UTC, so `setHours(0,0,0,0)` there lands on 01:00 in British
 * summer time and quietly drops anything filed in the first hour of the day
 * from the "since midnight" panel.
 */
export function startOfSiteDay(now = new Date()): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: SITE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const utcMidnight = new Date(`${ymd}T00:00:00Z`);
  return new Date(utcMidnight.getTime() - zoneOffsetMinutes(utcMidnight) * 60_000);
}

/**
 * Shared formatting, kept server-safe so both boundaries can use it. `now` is
 * injectable so a ticking client can re-render without each card reading its
 * own clock and disagreeing with its neighbours.
 */
export function relativeDate(iso: string, now: number = Date.now()) {
  const then = new Date(iso);
  const hours = (now - then.getTime()) / 3_600_000;
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
