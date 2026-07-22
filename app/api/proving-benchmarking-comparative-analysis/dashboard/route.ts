import { NextResponse } from "next/server";
import { dashboardRequest, requireBenchmarkingUser } from "../core";
export async function GET() { await requireBenchmarkingUser(); return NextResponse.json(await dashboardRequest()); }
export async function POST(request: Request) { await requireBenchmarkingUser(); return NextResponse.json(await dashboardRequest(request)); }
