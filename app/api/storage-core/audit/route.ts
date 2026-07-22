import { NextResponse } from "next/server";
import { auditRequest, requireStorageCoreUser } from "../core";
export async function GET() { await requireStorageCoreUser(); return NextResponse.json(await auditRequest()); }
export async function POST(request: Request) { await requireStorageCoreUser(); return NextResponse.json(await auditRequest(request)); }
