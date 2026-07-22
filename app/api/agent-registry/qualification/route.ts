import { NextResponse } from "next/server";
import { qualificationRequest, requireAgentRegistryUser } from "../core";
export async function GET() { await requireAgentRegistryUser(); return NextResponse.json(await qualificationRequest()); }
export async function POST(request: Request) { await requireAgentRegistryUser(); return NextResponse.json(await qualificationRequest(request)); }
