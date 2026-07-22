import { NextResponse } from "next/server";
import { evidenceRequest, requireAgentRegistryUser } from "../core";
export async function GET() { await requireAgentRegistryUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireAgentRegistryUser(); return NextResponse.json(await evidenceRequest(request)); }
