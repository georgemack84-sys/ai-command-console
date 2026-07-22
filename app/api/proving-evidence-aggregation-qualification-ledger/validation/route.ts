import { NextResponse } from "next/server";
import { requireEvidenceLedgerUser, validationEngineRequest } from "../core";
export async function GET() { await requireEvidenceLedgerUser(); return NextResponse.json(await validationEngineRequest()); }
export async function POST(request: Request) { await requireEvidenceLedgerUser(); return NextResponse.json(await validationEngineRequest(request)); }
