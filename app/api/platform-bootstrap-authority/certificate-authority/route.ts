import { NextResponse } from "next/server";
import { certificateAuthorityRequest, requireBootstrapUser } from "../core";
export async function GET() { await requireBootstrapUser(); return NextResponse.json(await certificateAuthorityRequest()); }
export async function POST(request: Request) { await requireBootstrapUser(); return NextResponse.json(await certificateAuthorityRequest(request)); }
