import { NextResponse } from "next/server";
import { memoryWorkflowsRequest, requireWaveFiveAuroraUser } from "../core";

export async function GET() { await requireWaveFiveAuroraUser(); return NextResponse.json(await memoryWorkflowsRequest()); }
export async function POST(request: Request) { await requireWaveFiveAuroraUser(); return NextResponse.json(await memoryWorkflowsRequest(request)); }
