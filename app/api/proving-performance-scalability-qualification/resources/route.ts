import { NextResponse } from "next/server";
import { requirePerformanceQualificationUser, resourcesRequest } from "../core";
export async function GET() { await requirePerformanceQualificationUser(); return NextResponse.json(await resourcesRequest()); }
export async function POST(request: Request) { await requirePerformanceQualificationUser(); return NextResponse.json(await resourcesRequest(request)); }
