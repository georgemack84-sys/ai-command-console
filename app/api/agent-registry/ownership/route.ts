import { NextResponse } from "next/server";
import { ownershipRequest, requireAgentRegistryUser } from "../core";
export async function GET() { await requireAgentRegistryUser(); return NextResponse.json(await ownershipRequest()); }
export async function POST(request: Request) { await requireAgentRegistryUser(); return NextResponse.json(await ownershipRequest(request)); }
