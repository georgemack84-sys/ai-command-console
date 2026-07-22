import { NextResponse } from "next/server";
import { projectionRequest, requireMissionManagementUser } from "../core";

export async function GET() { await requireMissionManagementUser(); return NextResponse.json(await projectionRequest()); }
export async function POST(request: Request) { await requireMissionManagementUser(); return NextResponse.json(await projectionRequest(request)); }
