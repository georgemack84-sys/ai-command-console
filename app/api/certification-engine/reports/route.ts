import { NextResponse } from "next/server";
import { reportsRequest, requireCertificationEngineUser } from "../core";

export async function GET() { await requireCertificationEngineUser(); return NextResponse.json(await reportsRequest()); }
export async function POST(request: Request) { await requireCertificationEngineUser(); return NextResponse.json(await reportsRequest(request)); }
