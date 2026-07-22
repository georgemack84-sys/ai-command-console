import { NextResponse } from "next/server";
import { delegationRequest, requireIdentityFullUser } from "../core";
export async function GET() { await requireIdentityFullUser(); return NextResponse.json(await delegationRequest()); }
export async function POST(request: Request) { await requireIdentityFullUser(); return NextResponse.json(await delegationRequest(request)); }
