import { NextResponse } from "next/server";
import { requireFederationUser, resilienceRequest } from "../core";
export async function GET() { await requireFederationUser(); return NextResponse.json(await resilienceRequest()); }
export async function POST(request: Request) { await requireFederationUser(); return NextResponse.json(await resilienceRequest(request)); }
