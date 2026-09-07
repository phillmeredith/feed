/**
 * Weather, drawn.
 *
 * The page said "Overcast" and left the reader to picture it. Every other
 * forecast on earth uses a glyph because the eye reads a symbol faster than a
 * word, and a column of them shows the shape of a week at a glance in a way
 * a column of adjectives never does.
 *
 * Drawn here rather than pulled from an icon set: these are strokes in the
 * site's own palette, they inherit currentColor, and they carry no licence.
 * The WMO code decides which one.
 */
export function WeatherGlyph({
  code,
  day = true,
  className = "",
  title,
}: {
  code: number;
  day?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {glyph(code, day)}
    </svg>
  );
}

function Sun() {
  return (
    <>
      <circle cx="16" cy="16" r="6" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line
          key={a}
          x1="16"
          y1="6.5"
          x2="16"
          y2="3"
          transform={`rotate(${a} 16 16)`}
        />
      ))}
    </>
  );
}

function Moon() {
  return <path d="M21 19.5A8 8 0 0 1 12.5 11a8 8 0 1 0 8.5 8.5Z" />;
}

function Cloud({ y = 0 }: { y?: number }) {
  return (
    <path
      d={`M9 ${20 + y}a4.2 4.2 0 0 1 .5-8.4 6 6 0 0 1 11.4-1.2A4.6 4.6 0 0 1 22 ${20 + y}Z`}
    />
  );
}

/** Rain, snow and hail all read as marks falling below the cloud. */
function Fall({ kind, count = 3 }: { kind: "rain" | "snow" | "sleet"; count?: number }) {
  const xs = count === 2 ? [12, 19] : [11, 16, 21];
  return (
    <>
      {xs.map((x, i) =>
        kind === "snow" ? (
          <g key={x} transform={`translate(${x} ${25 + (i % 2)})`}>
            <line x1="-2" y1="0" x2="2" y2="0" />
            <line x1="0" y1="-2" x2="0" y2="2" />
          </g>
        ) : (
          <line
            key={x}
            x1={x}
            y1={23 + (i % 2)}
            x2={x - 1.5}
            y2={kind === "sleet" ? 27 : 28.5}
          />
        )
      )}
    </>
  );
}

function glyph(code: number, day: boolean) {
  // Clear
  if (code === 0) return day ? <Sun /> : <Moon />;

  // Mainly clear and partly cloudy: the sun or moon behind cloud.
  if (code === 1 || code === 2) {
    return (
      <>
        <g transform="translate(4 -3) scale(0.62)" opacity={0.9}>
          {day ? <Sun /> : <Moon />}
        </g>
        <Cloud y={2} />
      </>
    );
  }

  if (code === 3) return <Cloud y={1} />;

  // Fog: cloud dissolving into layers.
  if (code === 45 || code === 48) {
    return (
      <>
        <Cloud y={-1} />
        <line x1="8" y1="24" x2="24" y2="24" />
        <line x1="10" y1="27.5" x2="22" y2="27.5" />
      </>
    );
  }

  // Drizzle and freezing drizzle.
  if (code >= 51 && code <= 57) {
    return (
      <>
        <Cloud y={-1} />
        <Fall kind={code >= 56 ? "sleet" : "rain"} count={2} />
      </>
    );
  }

  // Rain, freezing rain and showers.
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return (
      <>
        <Cloud y={-1} />
        <Fall kind={code === 66 || code === 67 ? "sleet" : "rain"} />
      </>
    );
  }

  // Snow, snow grains and snow showers.
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return (
      <>
        <Cloud y={-1} />
        <Fall kind="snow" />
      </>
    );
  }

  // Thunderstorms.
  if (code >= 95) {
    return (
      <>
        <Cloud y={-2} />
        <path d="M17 21l-4 5h4l-2 4.5" />
      </>
    );
  }

  return <Cloud y={1} />;
}
