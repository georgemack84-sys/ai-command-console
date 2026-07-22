import { NextResponse } from "next/server";
import { lifecycleRequest, requireCertificationEngineUser } from "../core";

export async function GET() { await requireCertificationEngineUser(); return NextResponse.json(await lifecycleRequest()); }
export async function POST(request: Request) { await requireCertificationEngineUser(); return NextResponse.json(await lifecycleRequest(request)); }
