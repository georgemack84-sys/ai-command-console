import { NextResponse } from "next/server";
import { requireBootstrapUser, securityRequest } from "../core";
export async function GET() { await requireBootstrapUser(); return NextResponse.json(await securityRequest()); }
export async function POST(request: Request) { await requireBootstrapUser(); return NextResponse.json(await securityRequest(request)); }
