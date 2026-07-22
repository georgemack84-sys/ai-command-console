import { NextResponse } from "next/server";
import { requireIdentityFullUser, suspensionRequest } from "../core";
export async function GET() { await requireIdentityFullUser(); return NextResponse.json(await suspensionRequest()); }
export async function POST(request: Request) { await requireIdentityFullUser(); return NextResponse.json(await suspensionRequest(request)); }
