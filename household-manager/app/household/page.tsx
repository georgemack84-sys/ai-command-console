"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createHouseholdService, type Chore, type ShoppingItem } from "../../lib/household/household-service";
import { memberService, type HouseholdMember } from "../../lib/household/member-service";
import { createClient } from "../../lib/supabase/client";
import { notifyContextChanged } from "../../lib/context/client-events";
import { RealtimeProvider } from "../../lib/realtime/realtime-provider";
import { useBillRealtimeReconciliation } from "../../lib/realtime/use-bill-realtime-reconciliation";
import { createPropriumBill, listPropriumBills, propriumBillSource, setPropriumBillPaymentStatus } from "../../lib/realtime/proprium-bill-source";

type Bill = { id: string; name: string; amount: number; dueDate: string; status: "UNPAID" | "PAID" };
const usingSupabase = process.env.NEXT_PUBLIC_HOUSEHOLD_STORAGE === "supabase";
async function supabaseHouseholdId() { const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error("Sign in to manage bills."); const { data } = await supabase.from("household_members").select("household_id").eq("user_id", user.id).maybeSingle(); if (!data) throw new Error("No household is associated with this account yet."); return data.household_id as string; }
async function listBills(): Promise<Bill[]> { if (propriumBillSource()) return (await listPropriumBills()).map((bill) => ({ id: bill.id, name: bill.name, amount: bill.amount, dueDate: bill.dueDate, status: bill.paymentStatus.toUpperCase() as Bill["status"] })); if (!usingSupabase) { const response = await fetch("/api/household?resource=bills"); return response.json() as Promise<Bill[]>; } const { data, error } = await createClient().from("bills").select("*").order("due_date"); if (error) throw new Error("Unable to load bills."); return (data ?? []).map((bill) => ({ id: bill.id, name: bill.name, amount: Number(bill.amount), dueDate: bill.due_date, status: bill.status as Bill["status"] })); }
async function createBill(name: string, amount: number, dueDate: string): Promise<Bill[]> { if (propriumBillSource()) { await createPropriumBill({ name, amount, dueDate }); return listBills(); } if (!usingSupabase) { const response = await fetch("/api/household", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "bills", name, amount, dueDate }) }); const result = await response.json() as Bill[] & { error?: string }; if (!response.ok) throw new Error(result.error ?? "Unable to add bill."); return result; } const { error } = await createClient().from("bills").insert({ household_id: await supabaseHouseholdId(), name, amount, due_date: dueDate }); if (error) throw new Error("Unable to add bill."); notifyContextChanged(); return listBills(); }
async function toggleBillPaid(id: string): Promise<Bill[]> { if (propriumBillSource()) { const bill = (await listBills()).find((item) => item.id === id); if (!bill) return listBills(); await setPropriumBillPaymentStatus(id, bill.status === "PAID" ? "Unpaid" : "Paid"); return listBills(); } if (!usingSupabase) { const response = await fetch("/api/household", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "bills", id }) }); const result = await response.json() as Bill[] & { error?: string }; if (!response.ok) throw new Error(result.error ?? "Unable to update bill."); return result; } const bills = await listBills(); const bill = bills.find((item) => item.id === id); if (!bill) return bills; const { error } = await createClient().from("bills").update({ status: bill.status === "PAID" ? "UNPAID" : "PAID", updated_at: new Date().toISOString() }).eq("id", id); if (error) throw new Error("Unable to update bill."); notifyContextChanged(); return listBills(); }

const householdService = createHouseholdService();

export default function HouseholdPage() {
  const source = propriumBillSource();
  return source ? <RealtimeProvider endpoint={`${source.origin}/api/v1/events/stream`} householdId={source.householdId}><HouseholdContent propriumBills /></RealtimeProvider> : <HouseholdContent propriumBills={false} />;
}

function HouseholdContent({ propriumBills }: { propriumBills: boolean }) {
  const [chores, setChores] = useState<Chore[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [choreTitle, setChoreTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [cadence, setCadence] = useState<Chore["cadence"]>("Weekly");
  const [dueDay, setDueDay] = useState("Any day");
  const [memberName, setMemberName] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [category, setCategory] = useState("");
  const [bills, setBills] = useState<Bill[]>([]);
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billDueDate, setBillDueDate] = useState("");
  const [billError, setBillError] = useState<string | null>(null);
  const [isAddingBill, setIsAddingBill] = useState(false);

  const refreshBills = useCallback(() => { void listBills().then(setBills); }, []);
  useEffect(() => {
    if (propriumBills) {
      void listBills().then(setBills);
      return;
    }

    void Promise.all([householdService.listChores(), householdService.listShopping(), memberService.list(), listBills()]).then(([savedChores, savedShopping, savedMembers, savedBills]) => {
      setChores(savedChores);
      setShopping(savedShopping);
      setMembers(savedMembers);
      setBills(savedBills);
    });
  }, [propriumBills]);
  const openItems = useMemo(() => shopping.filter((item) => !item.purchased).length, [shopping]);

  async function addChore(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setChores(await householdService.addChore(choreTitle, assignee, cadence, dueDay)); setChoreTitle(""); setAssignee(""); setDueDay("Any day"); }
  async function addItem(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setShopping(await householdService.addShopping(itemTitle, category)); setItemTitle(""); setCategory(""); }
  async function addMember(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setMembers(await memberService.add(memberName)); setMemberName(""); }
  async function addBill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBillError(null);
    setIsAddingBill(true);
    try {
      setBills(await createBill(billName, Number(billAmount), billDueDate));
      setBillName("");
      setBillAmount("");
      setBillDueDate("");
    } catch (error) {
      setBillError(error instanceof Error ? error.message : "Unable to add bill. Please try again.");
    } finally {
      setIsAddingBill(false);
    }
  }
  async function toggleBill(id: string) { setBills(await toggleBillPaid(id)); }
  async function manage<T>(resource: "chores" | "shopping", action: "rename" | "delete" | "archive", id?: string, title?: string) { const response = await fetch("/api/household", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource, action, id, title }) }); const result = await response.json() as T & { error?: string }; if (!response.ok) throw new Error(result.error ?? "Unable to update the household list."); return result; }
  async function renameChore(chore: Chore) { const title = window.prompt("Chore name", chore.title)?.trim(); if (title) setChores(await manage<Chore[]>("chores", "rename", chore.id, title)); }
  async function renameItem(item: ShoppingItem) { const title = window.prompt("Shopping item", item.title)?.trim(); if (title) setShopping(await manage<ShoppingItem[]>("shopping", "rename", item.id, title)); }

  return <><>{propriumBills && <PropriumBillReconciler refresh={refreshBills} />}</><main>
    <nav className="top-nav"><Link className="brand" href="/">Household Manager</Link><span><Link href="/today">Today</Link><Link href="/settings">Data &amp; backups</Link></span></nav>
    <section className="household-hero"><p className="eyebrow">Home operations</p><h1>Keep the everyday<br />moving.</h1><p className="lede">A shared place for the chores that repeat and the things the house needs next.</p></section>
    <section className="household-summary" aria-label="Household summary"><div><strong>{chores.filter((chore) => !chore.completed).length}</strong><span>open chores</span></div><div><strong>{openItems}</strong><span>items to buy</span></div><p>Shared securely through your self-hosted household server.</p></section>
    <section className="members-panel"><div><p className="eyebrow">Household members</p><h2>Who’s on the team?</h2><p className="meta">Add names once, then assign repeating chores from the list.</p></div><form className="member-form" onSubmit={addMember}><label>Name<input value={memberName} onChange={(event) => setMemberName(event.target.value)} placeholder="e.g. Alex" /></label><button type="submit">Add member</button></form><div className="member-chips">{members.length ? members.map((member) => <span key={member.id}>{member.name}<button type="button" aria-label={`Rename ${member.name}`} onClick={() => { const name = window.prompt("Member name", member.name)?.trim(); if (name) void memberService.rename(member.id, name).then(setMembers); }}>Edit</button><button type="button" aria-label={`Remove ${member.name}`} onClick={() => { if (window.confirm(`Remove ${member.name}? Their open chores will become unassigned.`)) void memberService.remove(member.id).then(setMembers).then(() => householdService.listChores()).then(setChores); }}>×</button></span>) : <span className="muted-chip">Add household members to assign chores.</span>}</div></section>
    <section className="household-grid">
      <article className="household-card"><p className="eyebrow">Recurring chores</p><h2>Everyone knows what’s next.</h2><form className="compact-form" onSubmit={addChore}><label>Chore<input value={choreTitle} onChange={(event) => setChoreTitle(event.target.value)} placeholder="e.g. Take out recycling" /></label><div className="compact-row"><label>Assigned to<select value={assignee} onChange={(event) => setAssignee(event.target.value)}><option value="">Unassigned</option>{members.map((member) => <option key={member.id} value={member.name}>{member.name}</option>)}</select></label><label>Repeats<select value={cadence} onChange={(event) => setCadence(event.target.value as Chore["cadence"])}><option>Weekly</option><option>Every 2 weeks</option><option>Monthly</option></select></label></div><label>Due day<select value={dueDay} onChange={(event) => setDueDay(event.target.value)}><option>Any day</option><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option></select></label><button type="submit">Add chore</button></form><div className="simple-list">{chores.length ? chores.map((chore) => <div className="simple-row" key={chore.id}><input aria-label={`Complete ${chore.title}`} type="checkbox" checked={chore.completed} onChange={() => void householdService.toggleChore(chore.id).then(setChores)} /><span><strong>{chore.title}</strong><small>{chore.assignee} · {chore.dueDay ?? "Any day"} · {chore.cadence}{chore.completionCount ? ` · completed ${chore.completionCount}×` : ""}</small></span><div className="row-actions"><button type="button" className="text-button" onClick={() => void renameChore(chore)}>Edit</button><button type="button" className="text-button danger-button" onClick={() => { if (window.confirm(`Remove ${chore.title}?`)) void manage<Chore[]>("chores", "delete", chore.id).then(setChores); }}>Remove</button></div></div>) : <p className="empty-tasks">Add a repeating chore to make the plan visible.</p>}</div></article>
      <article className="household-card shopping-card"><p className="eyebrow">Shared shopping list</p><h2>Never make a second trip.</h2><form className="compact-form" onSubmit={addItem}><label>Item<input value={itemTitle} onChange={(event) => setItemTitle(event.target.value)} placeholder="e.g. Dishwasher tablets" /></label><div className="compact-row"><label>Category<input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="e.g. Home care" /></label><button type="submit">Add item</button></div></form>{shopping.some((item) => item.purchased) && <button type="button" className="secondary archive-button" onClick={() => { if (window.confirm("Archive all purchased items?")) void manage<ShoppingItem[]>("shopping", "archive").then(setShopping); }}>Archive purchased</button>}<div className="simple-list">{shopping.length ? shopping.map((item) => <div className="simple-row" key={item.id}><input aria-label={`Mark ${item.title} purchased`} type="checkbox" checked={item.purchased} onChange={() => void householdService.toggleShopping(item.id).then(setShopping)} /><span><strong>{item.title}</strong><small>{item.category}{item.purchased ? " · In cart" : ""}</small></span><div className="row-actions"><button type="button" className="text-button" onClick={() => void renameItem(item)}>Edit</button><button type="button" className="text-button danger-button" onClick={() => { if (window.confirm(`Remove ${item.title}?`)) void manage<ShoppingItem[]>("shopping", "delete", item.id).then(setShopping); }}>Remove</button></div></div>) : <p className="empty-tasks">Keep your next store run in one calm list.</p>}</div></article>
    </section>
    <section className="household-grid"><article className="household-card"><p className="eyebrow">Bills</p><h2>Know what needs paying.</h2><form className="compact-form" onSubmit={(event) => void addBill(event)}><label>Bill name<input required value={billName} onChange={(event) => setBillName(event.target.value)} placeholder="e.g. Electric" /></label><div className="compact-row"><label>Amount<input required min="0" step="0.01" type="number" value={billAmount} onChange={(event) => setBillAmount(event.target.value)} placeholder="0.00" /></label><label>Due date<input required type="date" value={billDueDate} onChange={(event) => setBillDueDate(event.target.value)} /></label></div><button type="submit" disabled={isAddingBill}>{isAddingBill ? "Adding bill…" : "Add bill"}</button></form>{billError && <p role="alert" className="form-error">{billError}</p>}<div className="simple-list">{bills.length ? bills.map((bill) => <div className="simple-row" key={bill.id}><input aria-label={`Mark ${bill.name} paid`} type="checkbox" checked={bill.status === "PAID"} onChange={() => void toggleBill(bill.id)} /><span><strong>{bill.name}</strong><small>${bill.amount.toFixed(2)} · due {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${bill.dueDate}T12:00:00`))}{bill.status === "PAID" ? " · Paid" : ""}</small></span></div>) : <p className="empty-tasks">Add bills here and the context engine will flag what needs attention.</p>}</div></article></section>
  </main></>;
}

function PropriumBillReconciler({ refresh }: { refresh: () => void }) {
  useBillRealtimeReconciliation(null, refresh);
  return null;
}
