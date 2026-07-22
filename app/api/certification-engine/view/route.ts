import { NextResponse } from "next/server";
import { requireCertificationEngineUser, viewRequest } from "../core";

export async function GET() { await requireCertificationEngineUser(); return NextResponse.json(await viewRequest()); }
export async function POST(request: Request) { await requireCertificationEngineUser(); return NextResponse.json(await viewRequest(request)); }
