import { NextResponse } from "next/server";
import { qualificationRequest, requireContinuousProvingUser } from "../core";
export async function GET() { await requireContinuousProvingUser(); return NextResponse.json(await qualificationRequest()); }
export async function POST(request: Request) { await requireContinuousProvingUser(); return NextResponse.json(await qualificationRequest(request)); }
