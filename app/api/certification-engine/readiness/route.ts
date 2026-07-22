import { NextResponse } from "next/server";
import { readinessRequest, requireCertificationEngineUser } from "../core";

export async function GET() { await requireCertificationEngineUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireCertificationEngineUser(); return NextResponse.json(await readinessRequest(request)); }
