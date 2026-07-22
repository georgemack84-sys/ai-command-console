import { NextResponse } from "next/server";
import { comparativeRequest, requireBenchmarkingUser } from "../core";
export async function GET() { await requireBenchmarkingUser(); return NextResponse.json(await comparativeRequest()); }
export async function POST(request: Request) { await requireBenchmarkingUser(); return NextResponse.json(await comparativeRequest(request)); }
