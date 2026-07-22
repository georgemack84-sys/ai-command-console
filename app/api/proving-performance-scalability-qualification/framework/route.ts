import { NextResponse } from "next/server";
import { frameworkRequest, requirePerformanceQualificationUser } from "../core";
export async function GET() { await requirePerformanceQualificationUser(); return NextResponse.json(await frameworkRequest()); }
export async function POST(request: Request) { await requirePerformanceQualificationUser(); return NextResponse.json(await frameworkRequest(request)); }
