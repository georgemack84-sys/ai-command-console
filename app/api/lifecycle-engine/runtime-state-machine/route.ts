import { NextResponse } from "next/server";
import { requireLifecycleEngineUser, runtimeStateMachineRequest } from "../core";
export async function GET() { await requireLifecycleEngineUser(); return NextResponse.json(await runtimeStateMachineRequest()); }
export async function POST(request: Request) { await requireLifecycleEngineUser(); return NextResponse.json(await runtimeStateMachineRequest(request)); }
