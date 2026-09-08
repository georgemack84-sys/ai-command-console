"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccessPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("Checking household access…");
  const [protectedMode, setProtectedMode] = useState(false);

  useEffect(() => { void fetch("/api/access").then((response) => response.json()).then((status: { protected: boolean; authenticated: boolean }) => { setProtectedMode(status.protected); if (!status.protected || status.authenticated) router.replace("/"); else setMessage("Enter the household PIN to continue."); }).catch(() => setMessage("Unable to check household access.")); }, [router]);
  async function unlock(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setMessage("Unlocking…"); const response = await fetch("/api/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) }); const result = await response.json() as { error?: string }; if (!response.ok) { setMessage(result.error ?? "Unable to unlock."); return; } router.replace("/"); }

  return <main className="access-page"><section className="access-card"><p className="eyebrow">Household Manager</p><h1>Welcome home.</h1><p className="lede">{message}</p>{protectedMode && <form className="access-form" onSubmit={unlock}><label>Household PIN<input inputMode="numeric" type="password" value={pin} onChange={(event) => setPin(event.target.value)} autoFocus /></label><button type="submit">Unlock household</button></form>}</section></main>;
}
