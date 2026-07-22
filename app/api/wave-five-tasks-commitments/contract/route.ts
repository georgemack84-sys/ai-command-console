import { NextResponse } from "next/server";
import { contractResponse, requireWaveFiveTasksCommitmentsUser } from "../core";

export async function GET() { await requireWaveFiveTasksCommitmentsUser(); return NextResponse.json(contractResponse()); }
