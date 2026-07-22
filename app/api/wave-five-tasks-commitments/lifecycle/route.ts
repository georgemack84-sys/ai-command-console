import { NextResponse } from "next/server";
import { lifecycleRequest, requireWaveFiveTasksCommitmentsUser } from "../core";

export async function GET() { await requireWaveFiveTasksCommitmentsUser(); return NextResponse.json(await lifecycleRequest()); }
export async function POST(request: Request) { await requireWaveFiveTasksCommitmentsUser(); return NextResponse.json(await lifecycleRequest(request)); }
