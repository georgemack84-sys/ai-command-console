import { NextResponse } from "next/server";
import { observabilityRequest, requireMissionManagementUser } from "../core";

export async function GET() { await requireMissionManagementUser(); return NextResponse.json(await observabilityRequest()); }
export async function POST(request: Request) { await requireMissionManagementUser(); return NextResponse.json(await observabilityRequest(request)); }
