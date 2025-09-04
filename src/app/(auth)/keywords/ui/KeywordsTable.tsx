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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
        <Input
          type="text"
          placeholder="Filter label..."
          value={(table.getColumn("label")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("label")?.setFilterValue(e.target.value)}
          className="w-60"
        />
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-6 text-center text-muted-foreground">
                No keywords yet
              </TableCell>
            </TableRow>
          )}
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
