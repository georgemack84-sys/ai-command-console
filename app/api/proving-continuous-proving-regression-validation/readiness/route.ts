import { NextResponse } from "next/server";
import { readinessRequest, requireContinuousProvingUser } from "../core";
export async function GET() { await requireContinuousProvingUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireContinuousProvingUser(); return NextResponse.json(await readinessRequest(request)); }
