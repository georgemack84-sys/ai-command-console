import { NextResponse } from "next/server";
import { requireRegistryCoreUser, securityRequest } from "../core";
export async function GET() { await requireRegistryCoreUser(); return NextResponse.json(await securityRequest()); }
export async function POST(request: Request) { await requireRegistryCoreUser(); return NextResponse.json(await securityRequest(request)); }
