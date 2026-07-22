import { NextResponse } from "next/server";
import { ledgerRequest, requireTrustProgramQualificationUser } from "../core";

export async function GET() { await requireTrustProgramQualificationUser(); return NextResponse.json(await ledgerRequest()); }
export async function POST(request: Request) { await requireTrustProgramQualificationUser(); return NextResponse.json(await ledgerRequest(request)); }
