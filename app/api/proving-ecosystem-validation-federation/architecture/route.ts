import { NextResponse } from "next/server";
import { architectureRequest, requireFederationUser } from "../core";
export async function GET() { await requireFederationUser(); return NextResponse.json(await architectureRequest()); }
export async function POST(request: Request) { await requireFederationUser(); return NextResponse.json(await architectureRequest(request)); }
