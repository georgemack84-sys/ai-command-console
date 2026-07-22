import { NextResponse } from "next/server";
import { requireBenchmarkingUser, scorecardRequest } from "../core";
export async function GET() { await requireBenchmarkingUser(); return NextResponse.json(await scorecardRequest()); }
export async function POST(request: Request) { await requireBenchmarkingUser(); return NextResponse.json(await scorecardRequest(request)); }
