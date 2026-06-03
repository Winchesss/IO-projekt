export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | Date | null | undefined;
};

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]) {
  const header = columns.map((column) => csvCell(column.header)).join(",");
  const body = rows.map((row) => columns.map((column) => csvCell(formatValue(column.value(row)))).join(","));

  return `\uFEFF${[header, ...body].join("\r\n")}`;
}

function formatValue(value: string | number | Date | null | undefined) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("pl-PL", { dateStyle: "short", timeStyle: "short" }).format(value);
  }

  return value === null || value === undefined ? "" : String(value);
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
