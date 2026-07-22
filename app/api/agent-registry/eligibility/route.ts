import { NextResponse } from "next/server";
import { eligibilityRequest, requireAgentRegistryUser } from "../core";
export async function GET() { await requireAgentRegistryUser(); return NextResponse.json(await eligibilityRequest()); }
export async function POST(request: Request) { await requireAgentRegistryUser(); return NextResponse.json(await eligibilityRequest(request)); }
