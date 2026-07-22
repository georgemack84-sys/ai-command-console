import { NextResponse } from "next/server";
import { impactRequest, requireContinuousProvingUser } from "../core";
export async function GET() { await requireContinuousProvingUser(); return NextResponse.json(await impactRequest()); }
export async function POST(request: Request) { await requireContinuousProvingUser(); return NextResponse.json(await impactRequest(request)); }
