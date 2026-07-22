import { NextResponse } from "next/server";
import { qualificationRequest, requireFederationUser } from "../core";
export async function GET() { await requireFederationUser(); return NextResponse.json(await qualificationRequest()); }
export async function POST(request: Request) { await requireFederationUser(); return NextResponse.json(await qualificationRequest(request)); }
