import { NextResponse } from "next/server";
import { configurationReferencesRequest, requireAgentRegistryUser } from "../core";
export async function GET() { await requireAgentRegistryUser(); return NextResponse.json(await configurationReferencesRequest()); }
export async function POST(request: Request) { await requireAgentRegistryUser(); return NextResponse.json(await configurationReferencesRequest(request)); }
