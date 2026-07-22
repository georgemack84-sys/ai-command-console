import { NextResponse } from "next/server";
import { prioritizationSchedulingRequest, requireWaveFiveTasksCommitmentsUser } from "../core";

export async function GET() { await requireWaveFiveTasksCommitmentsUser(); return NextResponse.json(await prioritizationSchedulingRequest()); }
export async function POST(request: Request) { await requireWaveFiveTasksCommitmentsUser(); return NextResponse.json(await prioritizationSchedulingRequest(request)); }
