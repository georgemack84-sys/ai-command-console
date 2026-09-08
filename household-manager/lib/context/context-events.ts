type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribeToContext(listener: Listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function publishContextInvalidated() { for (const listener of listeners) listener(); }
