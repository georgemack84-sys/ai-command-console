import { NextResponse } from "next/server";
import { authenticationRequest, requireIdentityCoreUser } from "../core";
export async function GET() { await requireIdentityCoreUser(); return NextResponse.json(await authenticationRequest()); }
export async function POST(request: Request) { await requireIdentityCoreUser(); return NextResponse.json(await authenticationRequest(request)); }
