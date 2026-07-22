import { NextResponse } from "next/server";
import { governanceRequest, requireEvidenceLedgerUser } from "../core";
export async function GET() { await requireEvidenceLedgerUser(); return NextResponse.json(await governanceRequest()); }
export async function POST(request: Request) { await requireEvidenceLedgerUser(); return NextResponse.json(await governanceRequest(request)); }
