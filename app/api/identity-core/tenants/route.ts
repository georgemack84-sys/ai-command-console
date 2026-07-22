import { NextResponse } from "next/server";
import { requireIdentityCoreUser, tenantsRequest } from "../core";
export async function GET() { await requireIdentityCoreUser(); return NextResponse.json(await tenantsRequest()); }
export async function POST(request: Request) { await requireIdentityCoreUser(); return NextResponse.json(await tenantsRequest(request)); }
