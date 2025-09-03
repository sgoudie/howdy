export function isDev(): boolean {
  try {
    return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEBUG === "true";
  } catch {
    return true;
  }
}

export function debugLog(...args: unknown[]) {
  if (isDev()) {
    // eslint-disable-next-line no-console
    console.debug("[Howdy]", ...args);
  }
}


