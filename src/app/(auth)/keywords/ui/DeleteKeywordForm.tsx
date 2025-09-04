"use client";

import { useActionState, useEffect } from "react";
import { deleteKeywordAction, type DeleteKeywordResult } from "../actions";

export function DeleteKeywordForm({
  id,
  onError,
  onSuccess,
}: {
  id: string;
  onError?: (msg: string) => void;
  onSuccess?: () => void;
}) {
  const [state, formAction, isPending] = useActionState<DeleteKeywordResult, FormData>(
    deleteKeywordAction,
    { ok: true },
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (onSuccess) onSuccess();
    } else if (!state.ok) {
      if (onError) onError(state.message);
    }
  }, [state, onError, onSuccess]);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>
    </form>
  );
}
