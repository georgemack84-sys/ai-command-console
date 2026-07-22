import { NextResponse } from "next/server";
import { platformRequest, requireIdentityCoreUser } from "../core";
export async function GET() { await requireIdentityCoreUser(); return NextResponse.json(await platformRequest()); }
export async function POST(request: Request) { await requireIdentityCoreUser(); return NextResponse.json(await platformRequest(request)); }
