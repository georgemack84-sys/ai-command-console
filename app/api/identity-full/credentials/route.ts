import { NextResponse } from "next/server";
import { credentialsRequest, requireIdentityFullUser } from "../core";
export async function GET() { await requireIdentityFullUser(); return NextResponse.json(await credentialsRequest()); }
export async function POST(request: Request) { await requireIdentityFullUser(); return NextResponse.json(await credentialsRequest(request)); }
