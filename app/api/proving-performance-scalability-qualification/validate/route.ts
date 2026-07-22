import { NextResponse } from "next/server";
import { requirePerformanceQualificationUser, validateRequest } from "../core";
export async function POST(request: Request) { await requirePerformanceQualificationUser(); return NextResponse.json(await validateRequest(request)); }
