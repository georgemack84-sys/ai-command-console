import { NextResponse } from "next/server";
import { governanceRequest, requireBenchmarkingUser } from "../core";
export async function GET() { await requireBenchmarkingUser(); return NextResponse.json(await governanceRequest()); }
export async function POST(request: Request) { await requireBenchmarkingUser(); return NextResponse.json(await governanceRequest(request)); }
