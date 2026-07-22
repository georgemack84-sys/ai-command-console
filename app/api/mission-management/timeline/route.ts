import { NextResponse } from "next/server";
import { requireMissionManagementUser, timelineRequest } from "../core";

export async function GET() { await requireMissionManagementUser(); return NextResponse.json(await timelineRequest()); }
export async function POST(request: Request) { await requireMissionManagementUser(); return NextResponse.json(await timelineRequest(request)); }
