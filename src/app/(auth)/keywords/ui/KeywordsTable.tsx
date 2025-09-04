"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { DeleteKeywordForm } from "./DeleteKeywordForm";

export type KeywordRow = { id: string; label: string; created_at: string };

export function KeywordsTable({ rows }: { rows: KeywordRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState<ColumnFiltersState>([]);

  const columns = useMemo<ColumnDef<KeywordRow>[]>(
    () => [
      {
        accessorKey: "label",
        header: ({ column }) => (
          <button
            type="button"
            className="text-left font-medium hover:underline"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Label{column.getIsSorted() ? (column.getIsSorted() === "asc" ? " ▲" : " ▼") : ""}
          </button>
        ),
        cell: ({ row }) => (
          <span className="tracking-wide uppercase">{row.getValue("label") as string}</span>
        ),
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <button
            type="button"
            className="text-left font-medium hover:underline"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Added{column.getIsSorted() ? (column.getIsSorted() === "asc" ? " ▲" : " ▼") : ""}
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-gray-600">
            {new Date(row.getValue("created_at") as string).toLocaleString()}
          </span>
        ),
        sortingFn: (a, b) =>
          new Date(a.getValue("created_at") as string).getTime() -
          new Date(b.getValue("created_at") as string).getTime(),
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => (
          <div className="text-right">
            <DeleteKeywordForm id={row.original.id} onError={(msg) => setError(msg)} />
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnFilters: filters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Filter label..."
          value={(table.getColumn("label")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("label")?.setFilterValue(e.target.value)}
          className="w-60 rounded-md border border-gray-300 bg-white/80 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="text-left text-gray-700">
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-3 py-2">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-6 text-center text-gray-500">
                  No keywords yet
                </td>
              </tr>
            )}
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
