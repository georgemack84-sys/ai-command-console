import { NextResponse } from "next/server";
import { requireIdentityCoreUser, tokensRequest } from "../core";
export async function GET() { await requireIdentityCoreUser(); return NextResponse.json(await tokensRequest()); }
export async function POST(request: Request) { await requireIdentityCoreUser(); return NextResponse.json(await tokensRequest(request)); }
