import { NextResponse } from "next/server";
import { requireWaveFiveTasksCommitmentsUser, tasksRequest } from "../core";

export async function GET() { await requireWaveFiveTasksCommitmentsUser(); return NextResponse.json(await tasksRequest()); }
export async function POST(request: Request) { await requireWaveFiveTasksCommitmentsUser(); return NextResponse.json(await tasksRequest(request)); }
