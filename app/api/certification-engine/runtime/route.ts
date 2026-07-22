import { NextResponse } from "next/server";
import { requireCertificationEngineUser, runtimeRequest } from "../core";

export async function GET() { await requireCertificationEngineUser(); return NextResponse.json(await runtimeRequest()); }
export async function POST(request: Request) { await requireCertificationEngineUser(); return NextResponse.json(await runtimeRequest(request)); }
