"use client";

import { useEffect } from "react";

const SESSION_KEY = "oryx_session_id";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function AnalyticsTracker() {
  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname.startsWith("/admin")) return;

    const sessionId = getOrCreateSessionId();
    const params = new URLSearchParams(window.location.search);
    const body = {
      session_id: sessionId,
      path: pathname || "/",
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
    };

    fetch("/api/v1/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  }, []);

  return null;
}
