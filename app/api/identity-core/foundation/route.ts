import { NextResponse } from "next/server";
import { foundationRequest, requireIdentityCoreUser } from "../core";
export async function GET() { await requireIdentityCoreUser(); return NextResponse.json(await foundationRequest()); }
export async function POST(request: Request) { await requireIdentityCoreUser(); return NextResponse.json(await foundationRequest(request)); }
