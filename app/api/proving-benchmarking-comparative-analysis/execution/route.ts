import { NextResponse } from "next/server";
import { executionRequest, requireBenchmarkingUser } from "../core";
export async function GET() { await requireBenchmarkingUser(); return NextResponse.json(await executionRequest()); }
export async function POST(request: Request) { await requireBenchmarkingUser(); return NextResponse.json(await executionRequest(request)); }
