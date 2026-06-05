import type React from "react";
import { StatusBadge } from "@/components/ui/status-badge";

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
};

export function DataTable<T extends { id: string }>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>{columns.map((column) => <th key={column.key.toString()} className="px-4 py-3 font-semibold">{column.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t transition hover:bg-cyan-50/40">
              {columns.map((column) => (
                <td key={column.key.toString()} className="px-4 py-3 align-top">
                  {column.render ? column.render(row) : String(row[column.key as keyof T] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { StatusBadge };
