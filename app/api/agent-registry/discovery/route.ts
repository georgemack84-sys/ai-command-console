import { NextResponse } from "next/server";
import { discoveryRequest, requireAgentRegistryUser } from "../core";
export async function GET() { await requireAgentRegistryUser(); return NextResponse.json(await discoveryRequest()); }
export async function POST(request: Request) { await requireAgentRegistryUser(); return NextResponse.json(await discoveryRequest(request)); }
