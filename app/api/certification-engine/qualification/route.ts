import { NextResponse } from "next/server";
import { qualificationRequest, requireCertificationEngineUser } from "../core";

export async function GET() { await requireCertificationEngineUser(); return NextResponse.json(await qualificationRequest()); }
export async function POST(request: Request) { await requireCertificationEngineUser(); return NextResponse.json(await qualificationRequest(request)); }
