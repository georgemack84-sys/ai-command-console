import { NextResponse } from "next/server";
import { managersRequest, requireLifecycleEngineUser } from "../core";
export async function GET() { await requireLifecycleEngineUser(); return NextResponse.json(await managersRequest()); }
export async function POST(request: Request) { await requireLifecycleEngineUser(); return NextResponse.json(await managersRequest(request)); }
