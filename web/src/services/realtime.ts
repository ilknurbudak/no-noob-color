// PocketBase realtime — SSE subscription to a collection.
// We connect directly to PocketBase (not through the FastAPI proxy) because
// SSE needs a long-lived connection. PB URL is configurable via VITE_PB_URL,
// defaults to localhost:8090.

const PB_URL = (import.meta.env.VITE_PB_URL as string | undefined) || "http://127.0.0.1:8090";

export interface RealtimeEvent {
  action: "create" | "update" | "delete";
  record: any;
}

type Listener = (e: RealtimeEvent) => void;

let eventSource: EventSource | null = null;
let clientId: string | null = null;
let listeners = new Map<string, Set<Listener>>();
let connecting = false;
let connectedToken: string | null = null;

function notify(channel: string, event: RealtimeEvent) {
  const set = listeners.get(channel);
  if (!set) return;
  for (const l of set) {
    try { l(event); } catch (e) { console.warn("realtime listener error:", e); }
  }
}

async function setSubscriptions(token: string) {
  if (!clientId) return;
  const subs = [...listeners.keys()];
  await fetch(PB_URL + "/api/realtime", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token,
    },
    body: JSON.stringify({ clientId, subscriptions: subs }),
  });
}

function open(token: string) {
  if (connecting) return;
  if (eventSource && connectedToken === token) return;
  if (eventSource) {
    eventSource.close();
    eventSource = null;
    clientId = null;
  }
  connecting = true;
  connectedToken = token;
  // Note: EventSource doesn't support custom headers directly, so PocketBase
  // requires a follow-up POST to set subscriptions with the token.
  eventSource = new EventSource(PB_URL + "/api/realtime");
  eventSource.addEventListener("PB_CONNECT", (e: any) => {
    try {
      const data = JSON.parse(e.data);
      clientId = data.clientId;
      connecting = false;
      setSubscriptions(token).catch(err => console.warn("PB subscribe failed:", err));
    } catch {}
  });
  eventSource.onmessage = (e) => {
    // Generic event — channel is in event.type but most PB events are typed
  };
  eventSource.onerror = () => {
    connecting = false;
    // Auto-reconnect by browser for EventSource; subscriptions may need re-set
  };
}

export function subscribe(channel: string, listener: Listener, token: string): () => void {
  if (!listeners.has(channel)) listeners.set(channel, new Set());
  listeners.get(channel)!.add(listener);

  // Add channel-specific message listener
  const handler = (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      notify(channel, { action: data.action, record: data.record });
    } catch {}
  };

  open(token);
  if (eventSource) eventSource.addEventListener(channel, handler as any);

  // Resync subscriptions when connection ready
  if (clientId) setSubscriptions(token).catch(() => {});

  return () => {
    const set = listeners.get(channel);
    if (set) {
      set.delete(listener);
      if (set.size === 0) listeners.delete(channel);
    }
    if (eventSource) eventSource.removeEventListener(channel, handler as any);
    if (connectedToken) setSubscriptions(connectedToken).catch(() => {});
  };
}

export function disconnect() {
  if (eventSource) eventSource.close();
  eventSource = null;
  clientId = null;
  listeners.clear();
  connectedToken = null;
}

export function isConnected(): boolean {
  return !!eventSource && eventSource.readyState === EventSource.OPEN;
}
