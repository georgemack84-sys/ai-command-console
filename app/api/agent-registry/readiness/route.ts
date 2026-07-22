import { NextResponse } from "next/server";
import { readinessRequest, requireAgentRegistryUser } from "../core";
export async function GET() { await requireAgentRegistryUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireAgentRegistryUser(); return NextResponse.json(await readinessRequest(request)); }
