import { NextResponse } from "next/server";
import { pipelineRequest, requireContinuousProvingUser } from "../core";
export async function GET() { await requireContinuousProvingUser(); return NextResponse.json(await pipelineRequest()); }
export async function POST(request: Request) { await requireContinuousProvingUser(); return NextResponse.json(await pipelineRequest(request)); }
