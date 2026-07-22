import { NextResponse } from "next/server";
import { agentsRequest, requireCertificationEngineUser } from "../core";

export async function GET() { await requireCertificationEngineUser(); return NextResponse.json(await agentsRequest()); }
export async function POST(request: Request) { await requireCertificationEngineUser(); return NextResponse.json(await agentsRequest(request)); }
