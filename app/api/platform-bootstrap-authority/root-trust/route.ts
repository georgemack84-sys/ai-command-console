import { NextResponse } from "next/server";
import { requireBootstrapUser, rootTrustRequest } from "../core";
export async function GET() { await requireBootstrapUser(); return NextResponse.json(await rootTrustRequest()); }
export async function POST(request: Request) { await requireBootstrapUser(); return NextResponse.json(await rootTrustRequest(request)); }
