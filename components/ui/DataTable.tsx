import type { ReactNode } from "react";

/**
 * A table of figures.
 *
 * Six components had written their own — the classification, two championship
 * tables, the leaderboard, the model catalogue and the places comparison —
 * each with its own row padding, its own header treatment and its own idea of
 * how a number should be set. They are the same table.
 *
 * Numerals come from the data face with tabular figures on, so columns align
 * whatever the digits are; the row rhythm comes from the density mode rather
 * than from whoever wrote the component.
 */
export interface Column<Row> {
  key: string;
  header: ReactNode;
  /** Right-align anything numeric; that is what the alignment is for. */
  align?: "left" | "right";
  /** Set in the data face with tabular figures. */
  numeric?: boolean;
  /** Hidden below this breakpoint, for columns that don't earn a phone. */
  hideBelow?: "sm" | "md" | "lg";
  width?: string;
  cell: (row: Row) => ReactNode;
}

const HIDE = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
} as const;

export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
}: {
  /** Always present; visually hidden unless a table needs it on the page. */
  caption: string;
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-small">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-rule">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={[
                  "kicker text-label text-faint pb-3",
                  column.align === "right" ? "text-right" : "text-left",
                  column.hideBelow ? HIDE[column.hideBelow] : "",
                ].join(" ")}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey(row, index)} className="border-b border-rule">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={[
                    "data-row pr-4 last:pr-0",
                    column.align === "right" ? "text-right" : "text-left",
                    column.numeric ? "figures" : "",
                    column.hideBelow ? HIDE[column.hideBelow] : "",
                  ].join(" ")}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
