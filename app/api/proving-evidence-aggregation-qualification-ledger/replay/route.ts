import { NextResponse } from "next/server";
import { replayReferencesRequest, requireEvidenceLedgerUser } from "../core";
export async function GET() { await requireEvidenceLedgerUser(); return NextResponse.json(await replayReferencesRequest()); }
export async function POST(request: Request) { await requireEvidenceLedgerUser(); return NextResponse.json(await replayReferencesRequest(request)); }
