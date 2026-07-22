import { NextResponse } from "next/server";
import { requireContinuousProvingUser, triggersRequest } from "../core";
export async function GET() { await requireContinuousProvingUser(); return NextResponse.json(await triggersRequest()); }
export async function POST(request: Request) { await requireContinuousProvingUser(); return NextResponse.json(await triggersRequest(request)); }
