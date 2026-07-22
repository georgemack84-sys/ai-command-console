import { NextResponse } from "next/server";
import { certificationTrustRequest, requireAgentRegistryUser } from "../core";
export async function GET() { await requireAgentRegistryUser(); return NextResponse.json(await certificationTrustRequest()); }
export async function POST(request: Request) { await requireAgentRegistryUser(); return NextResponse.json(await certificationTrustRequest(request)); }
