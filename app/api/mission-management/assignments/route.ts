import { NextResponse } from "next/server";
import { assignmentsRequest, requireMissionManagementUser } from "../core";

export async function GET() { await requireMissionManagementUser(); return NextResponse.json(await assignmentsRequest()); }
export async function POST(request: Request) { await requireMissionManagementUser(); return NextResponse.json(await assignmentsRequest(request)); }
