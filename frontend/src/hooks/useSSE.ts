"use client";
import { useEffect, useCallback } from "react";
import { mutate } from "swr";
import type { SSEEvent } from "@/types";

const SSE_URL = process.env.NEXT_PUBLIC_SSE_URL || "http://localhost:8000/api/v1/notifications/stream";

export function useSSE() {
  const handleEvent = useCallback((event: SSEEvent) => {
    if (event.type === "slot_update" && event.court_slot_id) {
      // Invalidate all court availability SWR keys so they refetch
      mutate((key) => typeof key === "string" && key.includes("availability"), undefined, { revalidate: true });
    }
  }, []);

  useEffect(() => {
    let es: EventSource;
    let retryTimeout: NodeJS.Timeout;

    function connect() {
      es = new EventSource(SSE_URL, { withCredentials: true });

      es.onmessage = (e) => {
        try {
          const data: SSEEvent = JSON.parse(e.data);
          if (data.type !== "ping") handleEvent(data);
        } catch {
          // ignore malformed events
        }
      };

      es.onerror = () => {
        es.close();
        // Reconnect after 3 seconds
        retryTimeout = setTimeout(connect, 3000);
      };
    }

    connect();
    return () => {
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, [handleEvent]);
}
