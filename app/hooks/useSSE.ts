import { useEffect, useRef } from 'react';

export function useSSE(
  url: string,
  onMessage: (data: any) => void,
  reconnectDelay = 3000
) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connect = () => {
      console.log('[SSE] Connecting...');
      const source = new EventSource(url);
      eventSourceRef.current = source;

      source.onopen = () => {
        console.log('[SSE] Connected');
      };

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch {
          console.warn('[SSE] Bad JSON:', event.data);
        }
      };

      source.onerror = () => {
        console.warn('[SSE] Connection lost, retrying...');
        source.close();
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(connect, reconnectDelay);
        }
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [url, onMessage, reconnectDelay]);
}
