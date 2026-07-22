import { NextResponse } from "next/server";
import { contractResponse, requireEvidenceLedgerUser } from "../core";
export async function GET() { await requireEvidenceLedgerUser(); return NextResponse.json(contractResponse()); }
