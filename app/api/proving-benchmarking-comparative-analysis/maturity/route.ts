import { NextResponse } from "next/server";
import { maturityRequest, requireBenchmarkingUser } from "../core";
export async function GET() { await requireBenchmarkingUser(); return NextResponse.json(await maturityRequest()); }
export async function POST(request: Request) { await requireBenchmarkingUser(); return NextResponse.json(await maturityRequest(request)); }
