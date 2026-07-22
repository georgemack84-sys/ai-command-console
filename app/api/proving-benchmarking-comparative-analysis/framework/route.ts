import { NextResponse } from "next/server";
import { frameworkRequest, requireBenchmarkingUser } from "../core";
export async function GET() { await requireBenchmarkingUser(); return NextResponse.json(await frameworkRequest()); }
export async function POST(request: Request) { await requireBenchmarkingUser(); return NextResponse.json(await frameworkRequest(request)); }
