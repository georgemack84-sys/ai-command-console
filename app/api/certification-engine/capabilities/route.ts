import { NextResponse } from "next/server";
import { capabilitiesRequest, requireCertificationEngineUser } from "../core";

export async function GET() { await requireCertificationEngineUser(); return NextResponse.json(await capabilitiesRequest()); }
export async function POST(request: Request) { await requireCertificationEngineUser(); return NextResponse.json(await capabilitiesRequest(request)); }
