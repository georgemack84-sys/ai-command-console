import { NextResponse } from "next/server";
import { dashboardRequest, requireContinuousProvingUser } from "../core";
export async function GET() { await requireContinuousProvingUser(); return NextResponse.json(await dashboardRequest()); }
export async function POST(request: Request) { await requireContinuousProvingUser(); return NextResponse.json(await dashboardRequest(request)); }
