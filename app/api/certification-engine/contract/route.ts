import { NextResponse } from "next/server";
import { contractResponse, requireCertificationEngineUser } from "../core";

export async function GET() { await requireCertificationEngineUser(); return NextResponse.json(contractResponse()); }
