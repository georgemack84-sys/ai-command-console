import { NextResponse } from "next/server";
import { crossProgramRequest, requireFederationUser } from "../core";
export async function GET() { await requireFederationUser(); return NextResponse.json(await crossProgramRequest()); }
export async function POST(request: Request) { await requireFederationUser(); return NextResponse.json(await crossProgramRequest(request)); }
