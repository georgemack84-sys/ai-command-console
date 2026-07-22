import { NextResponse } from "next/server";
import { requireBenchmarkingUser, trendsRequest } from "../core";
export async function GET() { await requireBenchmarkingUser(); return NextResponse.json(await trendsRequest()); }
export async function POST(request: Request) { await requireBenchmarkingUser(); return NextResponse.json(await trendsRequest(request)); }
