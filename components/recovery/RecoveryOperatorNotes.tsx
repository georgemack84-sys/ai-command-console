"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function RecoveryOperatorNotes({
  onSubmit,
}: {
  onSubmit: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!note.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(note.trim());
      setNote("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operator Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add operator note"
            className="min-h-28 w-full rounded-lg border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-sky-300/40"
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Add note"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

