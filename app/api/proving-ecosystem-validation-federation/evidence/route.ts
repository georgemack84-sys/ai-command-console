import { NextResponse } from "next/server";
import { evidenceRequest, requireFederationUser } from "../core";
export async function GET() { await requireFederationUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireFederationUser(); return NextResponse.json(await evidenceRequest(request)); }
