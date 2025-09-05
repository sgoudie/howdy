"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { debugLog } from "@/lib/debug";

export type LoaderState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

export function withUserData<UserShape, P extends { user: UserShape }>(
  Wrapped: (props: Omit<P, "user"> & { user: UserShape }) => React.ReactElement,
) {
  return function UserDataWrapper(props: Omit<P, "user">) {
    const [state, setState] = useState<LoaderState<UserShape>>({ status: "loading" });
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastUserIdRef = useRef<string | null>(null);

    useEffect(() => {
      let mounted = true;
      const setFailsafe = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (mounted && state.status === "loading") {
            setState({
              status: "error",
              message: "Profile could not be loaded. Please refresh the page.",
            });
          }
        }, 6000);
      };

      setFailsafe();
      (async () => {
        const { data, error } = await supabase.auth.getUser();
        if (!mounted) return;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (error || !data.user) {
          setState({
            status: "error",
            message: "Profile could not be loaded. Please refresh the page.",
          });
          return;
        }
        lastUserIdRef.current = data.user.id;
        setState({ status: "ready", data: data.user as unknown as UserShape });
      })();

      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        debugLog("User data auth change", event, session?.user?.id);
        if (event !== "SIGNED_IN" && event !== "USER_UPDATED") return;
        if (session?.user) {
          const uid = session.user.id;
          lastUserIdRef.current = uid;
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setState({ status: "ready", data: session.user as unknown as UserShape });
        }
      });
      return () => {
        mounted = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        sub.subscription.unsubscribe();
      };
    }, []);

    if (state.status === "loading") return <p className="text-sm text-gray-600">Loading...</p>;
    if (state.status === "error") return <p className="text-sm text-red-600">{state.message}</p>;
    return <Wrapped {...(props as Omit<P, "user">)} user={state.data} />;
  };
}

export function withAccountData<AccountShape, P extends { account: AccountShape }>(
  Wrapped: (props: Omit<P, "account"> & { account: AccountShape }) => React.ReactElement,
) {
  return function AccountDataWrapper(props: Omit<P, "account">) {
    const [state, setState] = useState<LoaderState<AccountShape>>({ status: "loading" });
    const reqId = useRef(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debug state changes
    useEffect(() => {
      debugLog("Account wrapper state changed:", state.status);
    }, [state.status]);

    useEffect(() => {
      let mounted = true;
      const loadForUser = async (userId: string) => {
        const current = ++reqId.current;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (mounted && reqId.current === current) {
            setState({
              status: "error",
              message: "Account could not be loaded. Please refresh the page.",
            });
          }
        }, 6000);
        debugLog("load account for", userId);
        try {
          const { data, error } = await supabase
            .from("accounts")
            .select("id,user_id,name,convertkit_api_key,convertkit_howdy_tag_label")
            .eq("user_id", userId)
            .limit(1)
            .maybeSingle();
          debugLog("account load completed", {
            mounted,
            currentReq: reqId.current,
            expectedReq: current,
          });
          if (!mounted || reqId.current !== current) {
            debugLog("account load ignored - component unmounted or stale request");
            return;
          }
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          if (error || !data) {
            debugLog("account load error", error, data);
            setState({
              status: "error",
              message: error?.message || "Account could not be loaded. Please refresh the page.",
            });
          } else {
            debugLog("account loaded successfully", data);
            debugLog("setting state to ready with data:", data);
            setState({ status: "ready", data: data as unknown as AccountShape });
          }
        } catch (err) {
          if (!mounted || reqId.current !== current) return;
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          debugLog("account load exception", err);
          setState({
            status: "error",
            message: "Account could not be loaded. Please refresh the page.",
          });
        }
      };

      (async () => {
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes.user?.id;
        if (userId) {
          setState({ status: "loading" });
          await loadForUser(userId);
        } else {
          setState({ status: "loading" });
        }
      })();

      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        debugLog("Account data auth change", event, session?.user?.id);
        if (event !== "SIGNED_IN" && event !== "USER_UPDATED") return;
        if (session?.user?.id) {
          setState({ status: "loading" });
          loadForUser(session.user.id);
        }
      });

      return () => {
        mounted = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        sub.subscription.unsubscribe();
      };
    }, []);

    debugLog("Account wrapper rendering with state:", state.status);
    if (state.status === "loading") return <p className="text-sm text-gray-600">Loading...</p>;
    if (state.status === "error") return <p className="text-sm text-red-600">{state.message}</p>;
    return <Wrapped {...(props as Omit<P, "account">)} account={state.data} />;
  };
}
