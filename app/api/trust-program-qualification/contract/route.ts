import { NextResponse } from "next/server";
import { contractResponse, requireTrustProgramQualificationUser } from "../core";

export async function GET() { await requireTrustProgramQualificationUser(); return NextResponse.json(contractResponse()); }
