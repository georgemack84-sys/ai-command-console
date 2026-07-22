import { NextResponse } from "next/server";
import { contractResponse, requireAgentRegistryUser } from "../core";
export async function GET() { await requireAgentRegistryUser(); return NextResponse.json(contractResponse()); }
