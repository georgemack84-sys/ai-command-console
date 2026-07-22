import { NextResponse } from "next/server";
import { dependenciesRequest, requireWaveFiveTasksCommitmentsUser } from "../core";

export async function GET() { await requireWaveFiveTasksCommitmentsUser(); return NextResponse.json(await dependenciesRequest()); }
export async function POST(request: Request) { await requireWaveFiveTasksCommitmentsUser(); return NextResponse.json(await dependenciesRequest(request)); }
