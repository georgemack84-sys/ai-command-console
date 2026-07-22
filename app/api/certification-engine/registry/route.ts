import { NextResponse } from "next/server";
import { registryRequest, requireCertificationEngineUser } from "../core";

export async function GET() { await requireCertificationEngineUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireCertificationEngineUser(); return NextResponse.json(await registryRequest(request)); }
