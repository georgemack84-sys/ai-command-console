import { NextResponse } from "next/server";
import { evidenceRequest, requireContinuousProvingUser } from "../core";
export async function GET() { await requireContinuousProvingUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireContinuousProvingUser(); return NextResponse.json(await evidenceRequest(request)); }
