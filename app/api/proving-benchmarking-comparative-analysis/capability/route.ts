import { NextResponse } from "next/server";
import { capabilityRequest, requireBenchmarkingUser } from "../core";
export async function GET() { await requireBenchmarkingUser(); return NextResponse.json(await capabilityRequest()); }
export async function POST(request: Request) { await requireBenchmarkingUser(); return NextResponse.json(await capabilityRequest(request)); }
