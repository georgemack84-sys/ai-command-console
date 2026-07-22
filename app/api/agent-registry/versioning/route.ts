import { NextResponse } from "next/server";
import { requireAgentRegistryUser, versioningRequest } from "../core";
export async function GET() { await requireAgentRegistryUser(); return NextResponse.json(await versioningRequest()); }
export async function POST(request: Request) { await requireAgentRegistryUser(); return NextResponse.json(await versioningRequest(request)); }
