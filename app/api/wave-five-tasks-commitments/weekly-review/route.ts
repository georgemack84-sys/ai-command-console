import { NextResponse } from "next/server";
import { requireWaveFiveTasksCommitmentsUser, weeklyReviewRequest } from "../core";

export async function GET() { await requireWaveFiveTasksCommitmentsUser(); return NextResponse.json(await weeklyReviewRequest()); }
export async function POST(request: Request) { await requireWaveFiveTasksCommitmentsUser(); return NextResponse.json(await weeklyReviewRequest(request)); }
