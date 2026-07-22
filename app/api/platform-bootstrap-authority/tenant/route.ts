import { NextResponse } from "next/server";
import { requireBootstrapUser, tenantRequest } from "../core";
export async function GET() { await requireBootstrapUser(); return NextResponse.json(await tenantRequest()); }
export async function POST(request: Request) { await requireBootstrapUser(); return NextResponse.json(await tenantRequest(request)); }
