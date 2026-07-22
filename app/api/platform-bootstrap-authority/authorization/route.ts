import { NextResponse } from "next/server";
import { authorizationRequest, requireBootstrapUser } from "../core";
export async function GET() { await requireBootstrapUser(); return NextResponse.json(await authorizationRequest()); }
export async function POST(request: Request) { await requireBootstrapUser(); return NextResponse.json(await authorizationRequest(request)); }
