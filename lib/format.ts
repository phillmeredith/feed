/** Shared formatting, kept server-safe so both boundaries can use it. */
export function relativeDate(iso: string) {
  const then = new Date(iso);
  const hours = (Date.now() - then.getTime()) / 3_600_000;
  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
