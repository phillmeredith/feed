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

/**
 * Dates and times for the sport desks, in the reader's zone rather than the
 * server's.
 *
 * The three sport components each called toLocaleDateString with no timeZone,
 * which renders in whatever zone the process happens to be in — UTC on
 * Vercel. For a Saturday afternoon Grand Prix that is invisible; for a UFC
 * card at 02:00Z it is the wrong day, and for six months of the year every
 * British time label was an hour out, because the UK is on BST from late
 * March to late October and UTC is not.
 */
export function sportDate(iso: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: SITE_TIME_ZONE,
    ...options,
  });
}

/** A start time with the zone named, because "19:00" alone invites the doubt. */
export function sportTime(iso: string) {
  const at = new Date(iso);
  const time = at.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SITE_TIME_ZONE,
  });
  return `${time} ${zoneLabel(at)}`;
}

/** BST or GMT, decided by the date rather than assumed. */
export function zoneLabel(at: Date) {
  const name = new Intl.DateTimeFormat("en-GB", {
    timeZone: SITE_TIME_ZONE,
    timeZoneName: "short",
  })
    .formatToParts(at)
    .find((part) => part.type === "timeZoneName")?.value;
  return name ?? "";
}

/** Whether an instant has passed, for deciding scheduled against finished. */
export function hasPassed(iso: string, now: number = Date.now()) {
  return new Date(iso).getTime() < now;
}

/** Whether a fetch timestamp is old enough to be worth warning about. */
export function isStale(iso: string, maxAgeHours = 24, now: number = Date.now()) {
  return now - new Date(iso).getTime() > maxAgeHours * 3_600_000;
}
