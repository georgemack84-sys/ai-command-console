import { NextResponse } from "next/server";
import { commitmentsRequest, requireWaveFiveTasksCommitmentsUser } from "../core";

export async function GET() { await requireWaveFiveTasksCommitmentsUser(); return NextResponse.json(await commitmentsRequest()); }
export async function POST(request: Request) { await requireWaveFiveTasksCommitmentsUser(); return NextResponse.json(await commitmentsRequest(request)); }
