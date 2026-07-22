import { NextResponse } from "next/server";
import { regressionRequest, requireContinuousProvingUser } from "../core";
export async function GET() { await requireContinuousProvingUser(); return NextResponse.json(await regressionRequest()); }
export async function POST(request: Request) { await requireContinuousProvingUser(); return NextResponse.json(await regressionRequest(request)); }
