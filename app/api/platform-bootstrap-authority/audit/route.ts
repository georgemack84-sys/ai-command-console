import { NextResponse } from "next/server";
import { auditRequest, requireBootstrapUser } from "../core";
export async function GET() { await requireBootstrapUser(); return NextResponse.json(await auditRequest()); }
export async function POST(request: Request) { await requireBootstrapUser(); return NextResponse.json(await auditRequest(request)); }
