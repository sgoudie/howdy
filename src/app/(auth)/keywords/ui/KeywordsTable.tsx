"use client";

import { useState } from "react";
import { DeleteKeywordForm } from "./DeleteKeywordForm";

export type KeywordRow = { id: string; label: string; created_at: string };

export function KeywordsTable({ rows }: { rows: KeywordRow[] }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600">
            <th className="py-2">Label</th>
            <th className="py-2">Added</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="py-6 text-center text-gray-500">No keywords yet</td>
            </tr>
          )}
          {rows.map((k) => (
            <tr key={k.id} className="border-t">
              <td className="py-2">{k.label}</td>
              <td className="py-2 text-gray-600">{new Date(k.created_at).toLocaleString()}</td>
              <td className="py-2 text-right">
                <DeleteKeywordForm id={k.id} onError={(msg) => setError(msg)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
    </div>
  );
}


