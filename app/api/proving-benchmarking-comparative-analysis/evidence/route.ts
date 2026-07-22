import { NextResponse } from "next/server";
import { evidenceRequest, requireBenchmarkingUser } from "../core";
export async function GET() { await requireBenchmarkingUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireBenchmarkingUser(); return NextResponse.json(await evidenceRequest(request)); }
