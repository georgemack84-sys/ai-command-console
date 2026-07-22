import { NextResponse } from "next/server";
import { identityRequest, requireBootstrapUser } from "../core";
export async function GET() { await requireBootstrapUser(); return NextResponse.json(await identityRequest()); }
export async function POST(request: Request) { await requireBootstrapUser(); return NextResponse.json(await identityRequest(request)); }
