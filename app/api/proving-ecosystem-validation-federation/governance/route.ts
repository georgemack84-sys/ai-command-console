import { NextResponse } from "next/server";
import { governanceRequest, requireFederationUser } from "../core";
export async function GET() { await requireFederationUser(); return NextResponse.json(await governanceRequest()); }
export async function POST(request: Request) { await requireFederationUser(); return NextResponse.json(await governanceRequest(request)); }
