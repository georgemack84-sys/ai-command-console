import { NextResponse } from "next/server";
import { registryRequest, requireEvidenceLedgerUser } from "../core";
export async function GET() { await requireEvidenceLedgerUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireEvidenceLedgerUser(); return NextResponse.json(await registryRequest(request)); }
