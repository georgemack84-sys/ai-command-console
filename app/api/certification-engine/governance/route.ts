import { NextResponse } from "next/server";
import { governanceRequest, requireCertificationEngineUser } from "../core";

export async function GET() { await requireCertificationEngineUser(); return NextResponse.json(await governanceRequest()); }
export async function POST(request: Request) { await requireCertificationEngineUser(); return NextResponse.json(await governanceRequest(request)); }
