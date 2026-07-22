import { NextResponse } from "next/server";
import { requireCertificationEngineUser, serviceRequest } from "../core";

export async function GET() { await requireCertificationEngineUser(); return NextResponse.json(await serviceRequest()); }
export async function POST(request: Request) { await requireCertificationEngineUser(); return NextResponse.json(await serviceRequest(request)); }
