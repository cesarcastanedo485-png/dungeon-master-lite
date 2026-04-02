import { useState, useEffect, useRef, useCallback } from "react";

export interface GameEvent {
  type: string;
  term?: string;
  path?: string;
  to?: string;
  content?: string;
  username?: string;
  message?: string;
  status?: string;
  reason?: string;
  uniqueId?: string;
}

export function useGameEvents() {
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const retryRef = useRef(0);
  const esRef = useRef<EventSource | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource("/api/events");
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as GameEvent;
        if (data.type === "connected") {
          retryRef.current = 0;
          return;
        }
        if (mountedRef.current) {
          setLastEvent(data);
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      if (!mountedRef.current) return;
      const delay = Math.min(1000 * Math.pow(2, retryRef.current), 30000);
      retryRef.current++;
      retryTimerRef.current = setTimeout(connect, delay);
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      esRef.current?.close();
      esRef.current = null;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [connect]);

  return { lastEvent };
}
