import { NextResponse } from "next/server";
import { apisRequest, requireCertificationEngineUser } from "../core";

export async function GET() { await requireCertificationEngineUser(); return NextResponse.json(await apisRequest()); }
export async function POST(request: Request) { await requireCertificationEngineUser(); return NextResponse.json(await apisRequest(request)); }
