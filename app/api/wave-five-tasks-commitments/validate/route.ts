import { NextResponse } from "next/server";
import { requireWaveFiveTasksCommitmentsUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveFiveTasksCommitmentsUser(); return NextResponse.json(await validateRequest(request)); }
