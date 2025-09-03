"use client";

import { useActionState, useEffect, useState } from "react";
import { addKeywordAction, type AddKeywordResult } from "../actions";

export function AddKeywordForm() {
  const [state, formAction, isPending] = useActionState<AddKeywordResult, FormData>(addKeywordAction, { ok: true });
  const [clientError, setClientError] = useState<string | null>(null);
  const [value, setValue] = useState<string>("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValue(v.toUpperCase());
    if (/\s/.test(v)) setClientError("Labels cannot contain spaces.");
    else setClientError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const input = form.elements.namedItem("label") as HTMLInputElement | null;
    if (input && /\s/.test(input.value)) {
      e.preventDefault();
      setClientError("Labels cannot contain spaces.");
    }
  }

  useEffect(() => {
    if (state && state.ok) {
      setValue("");
      setClientError(null);
    }
  }, [state]);

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          name="label"
          placeholder="keyword label"
          value={value}
          onChange={handleChange}
          className="w-full max-w-xs rounded-lg border border-gray-300 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Adding..." : "Add"}
        </button>
      </div>
      {(clientError || (state && !state.ok)) && (
        <div className="text-sm text-red-600">{clientError || (!state.ok ? state.message : "")}</div>
      )}
    </form>
  );
}


