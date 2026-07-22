import { NextResponse } from "next/server";
import { contractResponse, requireBenchmarkingUser } from "../core";
export async function GET() { await requireBenchmarkingUser(); return NextResponse.json(contractResponse()); }
