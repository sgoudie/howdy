"use client";

import { useActionState, useEffect, useState } from "react";
import { addKeywordAction, type AddKeywordResult } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AddKeywordForm() {
  const [state, formAction, isPending] = useActionState<AddKeywordResult, FormData>(
    addKeywordAction,
    { ok: true },
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const [value, setValue] = useState<string>("");
  const [serverError, setServerError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValue(v.toUpperCase());
    if (/\s/.test(v)) setClientError("Labels cannot contain spaces.");
    else setClientError(null);
    if (serverError) setServerError(null);
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
      setServerError(null);
    } else if (state && !state.ok) {
      setServerError(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="flex w-full max-w-xs flex-col gap-1">
          <label htmlFor="keyword-label" className="text-sm font-medium">
            Keyword label
          </label>
          <Input
            id="keyword-label"
            type="text"
            name="label"
            placeholder="keyword label"
            value={value}
            onChange={handleChange}
            className="uppercase"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding..." : "Add"}
        </Button>
      </div>
      {(clientError || serverError) && (
        <div className="text-sm text-red-600">{clientError || serverError}</div>
      )}
    </form>
  );
}
