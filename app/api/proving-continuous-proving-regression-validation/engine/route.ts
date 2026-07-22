import { NextResponse } from "next/server";
import { engineRequest, requireContinuousProvingUser } from "../core";
export async function GET() { await requireContinuousProvingUser(); return NextResponse.json(await engineRequest()); }
export async function POST(request: Request) { await requireContinuousProvingUser(); return NextResponse.json(await engineRequest(request)); }
