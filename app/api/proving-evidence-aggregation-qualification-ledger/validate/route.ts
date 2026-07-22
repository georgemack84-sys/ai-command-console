import { NextResponse } from "next/server";
import { requireEvidenceLedgerUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireEvidenceLedgerUser(); return NextResponse.json(await validateRequest(request)); }
