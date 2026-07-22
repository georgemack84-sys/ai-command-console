import { NextResponse } from "next/server";
import { lifecycleRequest, requireMissionManagementUser } from "../core";

export async function GET() { await requireMissionManagementUser(); return NextResponse.json(await lifecycleRequest()); }
export async function POST(request: Request) { await requireMissionManagementUser(); return NextResponse.json(await lifecycleRequest(request)); }
