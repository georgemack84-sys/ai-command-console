import { NextResponse } from "next/server";
import { requireIdentityCoreUser, transferRequest } from "../core";
export async function GET() { await requireIdentityCoreUser(); return NextResponse.json(await transferRequest()); }
export async function POST(request: Request) { await requireIdentityCoreUser(); return NextResponse.json(await transferRequest(request)); }
