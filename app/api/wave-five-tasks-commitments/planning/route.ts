import { NextResponse } from "next/server";
import { planningRequest, requireWaveFiveTasksCommitmentsUser } from "../core";

export async function GET() { await requireWaveFiveTasksCommitmentsUser(); return NextResponse.json(await planningRequest()); }
export async function POST(request: Request) { await requireWaveFiveTasksCommitmentsUser(); return NextResponse.json(await planningRequest(request)); }
