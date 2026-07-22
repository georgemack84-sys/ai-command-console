import { NextResponse } from "next/server";
import { contractResponse, requirePerformanceQualificationUser } from "../core";
export async function GET() { await requirePerformanceQualificationUser(); return NextResponse.json(contractResponse()); }
