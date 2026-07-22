import { NextResponse } from "next/server";
import { requireLifecycleEngineUser, transitionValidationRequest } from "../core";
export async function GET() { await requireLifecycleEngineUser(); return NextResponse.json(await transitionValidationRequest()); }
export async function POST(request: Request) { await requireLifecycleEngineUser(); return NextResponse.json(await transitionValidationRequest(request)); }
