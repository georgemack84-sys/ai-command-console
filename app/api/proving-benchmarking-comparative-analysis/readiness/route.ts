import { NextResponse } from "next/server";
import { readinessRequest, requireBenchmarkingUser } from "../core";
export async function GET() { await requireBenchmarkingUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireBenchmarkingUser(); return NextResponse.json(await readinessRequest(request)); }
