import { NextResponse } from "next/server";
import { evidenceRequest, requireCertificationEngineUser } from "../core";

export async function GET() { await requireCertificationEngineUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireCertificationEngineUser(); return NextResponse.json(await evidenceRequest(request)); }
