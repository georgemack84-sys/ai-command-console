import { NextResponse } from "next/server";
import { federationRequest, requireEvidenceLedgerUser } from "../core";
export async function GET() { await requireEvidenceLedgerUser(); return NextResponse.json(await federationRequest()); }
export async function POST(request: Request) { await requireEvidenceLedgerUser(); return NextResponse.json(await federationRequest(request)); }
