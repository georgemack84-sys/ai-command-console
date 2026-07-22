import { NextResponse } from "next/server";
import { auditRequest, requireIdentityCoreUser } from "../core";
export async function GET() { await requireIdentityCoreUser(); return NextResponse.json(await auditRequest()); }
export async function POST(request: Request) { await requireIdentityCoreUser(); return NextResponse.json(await auditRequest(request)); }
