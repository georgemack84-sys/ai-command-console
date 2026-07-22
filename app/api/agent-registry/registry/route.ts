import { NextResponse } from "next/server";
import { registryRequest, requireAgentRegistryUser } from "../core";
export async function GET() { await requireAgentRegistryUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireAgentRegistryUser(); return NextResponse.json(await registryRequest(request)); }
