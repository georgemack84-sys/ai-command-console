import { NextResponse } from "next/server";
import { authorizationRequest, requireIdentityCoreUser } from "../core";
export async function GET() { await requireIdentityCoreUser(); return NextResponse.json(await authorizationRequest()); }
export async function POST(request: Request) { await requireIdentityCoreUser(); return NextResponse.json(await authorizationRequest(request)); }
