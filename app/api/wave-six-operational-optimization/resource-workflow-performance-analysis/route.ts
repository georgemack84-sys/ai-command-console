import { NextResponse } from "next/server";
import { requireWaveSixOperationalOptimizationUser, resourceWorkflowPerformanceAnalysisRequest } from "../core";

export async function GET() { await requireWaveSixOperationalOptimizationUser(); return NextResponse.json(await resourceWorkflowPerformanceAnalysisRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalOptimizationUser(); return NextResponse.json(await resourceWorkflowPerformanceAnalysisRequest(request)); }
