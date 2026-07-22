import { NextResponse } from "next/server";
import { identityRequest, requireAgentRegistryUser } from "../core";
export async function GET() { await requireAgentRegistryUser(); return NextResponse.json(await identityRequest()); }
export async function POST(request: Request) { await requireAgentRegistryUser(); return NextResponse.json(await identityRequest(request)); }
