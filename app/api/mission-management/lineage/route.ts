import { NextResponse } from "next/server";
import { lineageRequest, requireMissionManagementUser } from "../core";

export async function GET() { await requireMissionManagementUser(); return NextResponse.json(await lineageRequest()); }
export async function POST(request: Request) { await requireMissionManagementUser(); return NextResponse.json(await lineageRequest(request)); }
