"use client";

import { useActionState, useEffect } from "react";
import { deleteKeywordAction, type DeleteKeywordResult } from "../actions";
import { Button } from "@/components/ui/button";

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
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? "Deleting..." : "Delete"}
      </Button>
    </form>
  );
}
