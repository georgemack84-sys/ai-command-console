import { NextResponse } from "next/server";
import { requireCertificationEngineUser, skillsRequest } from "../core";

export async function GET() { await requireCertificationEngineUser(); return NextResponse.json(await skillsRequest()); }
export async function POST(request: Request) { await requireCertificationEngineUser(); return NextResponse.json(await skillsRequest(request)); }
