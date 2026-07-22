import { NextResponse } from "next/server";
import { lineageRequest, requireAgentRegistryUser } from "../core";
export async function GET() { await requireAgentRegistryUser(); return NextResponse.json(await lineageRequest()); }
export async function POST(request: Request) { await requireAgentRegistryUser(); return NextResponse.json(await lineageRequest(request)); }
