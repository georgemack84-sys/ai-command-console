import { NextResponse } from "next/server";
import { requireAgentRegistryUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireAgentRegistryUser(); return NextResponse.json(await validateRequest(request)); }
