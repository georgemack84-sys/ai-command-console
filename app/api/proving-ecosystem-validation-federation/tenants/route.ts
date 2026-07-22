import { NextResponse } from "next/server";
import { requireFederationUser, tenantsRequest } from "../core";
export async function GET() { await requireFederationUser(); return NextResponse.json(await tenantsRequest()); }
export async function POST(request: Request) { await requireFederationUser(); return NextResponse.json(await tenantsRequest(request)); }
