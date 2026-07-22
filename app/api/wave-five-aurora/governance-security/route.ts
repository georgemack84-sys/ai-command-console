import { NextResponse } from "next/server";
import { governanceSecurityRequest, requireWaveFiveAuroraUser } from "../core";

export async function GET() { await requireWaveFiveAuroraUser(); return NextResponse.json(await governanceSecurityRequest()); }
export async function POST(request: Request) { await requireWaveFiveAuroraUser(); return NextResponse.json(await governanceSecurityRequest(request)); }
