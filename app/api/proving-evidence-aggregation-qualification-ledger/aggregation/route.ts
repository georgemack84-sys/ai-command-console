import { NextResponse } from "next/server";
import { aggregationRequest, requireEvidenceLedgerUser } from "../core";
export async function GET() { await requireEvidenceLedgerUser(); return NextResponse.json(await aggregationRequest()); }
export async function POST(request: Request) { await requireEvidenceLedgerUser(); return NextResponse.json(await aggregationRequest(request)); }
