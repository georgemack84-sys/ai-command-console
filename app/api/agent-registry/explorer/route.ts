import { NextResponse } from "next/server";
import { explorerRequest, requireAgentRegistryUser } from "../core";
export async function GET() { await requireAgentRegistryUser(); return NextResponse.json(await explorerRequest()); }
export async function POST(request: Request) { await requireAgentRegistryUser(); return NextResponse.json(await explorerRequest(request)); }
