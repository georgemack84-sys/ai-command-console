import { NextResponse } from "next/server";
import { federationRequest, requireIdentityFullUser } from "../core";
export async function GET() { await requireIdentityFullUser(); return NextResponse.json(await federationRequest()); }
export async function POST(request: Request) { await requireIdentityFullUser(); return NextResponse.json(await federationRequest(request)); }
