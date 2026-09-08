"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("Enter your email to receive a secure sign-in link.");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const { error } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (error) throw error;
      setMessage("Check your email for the sign-in link.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to start sign-in."); }
  }
  return <main><section className="hero"><p className="eyebrow">Household Manager</p><h1>Welcome home.</h1><form className="location-form" onSubmit={submit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><button type="submit">Email me a sign-in link</button></form><p className="notice" role="status">{message}</p></section></main>;
}
