import { NextResponse } from "next/server";
import { requireBenchmarkingUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireBenchmarkingUser(); return NextResponse.json(await validateRequest(request)); }
