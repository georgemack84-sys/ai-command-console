import { NextResponse } from "next/server";
import { apisRequest, requireMissionManagementUser } from "../core";

export async function GET() { await requireMissionManagementUser(); return NextResponse.json(await apisRequest()); }
export async function POST(request: Request) { await requireMissionManagementUser(); return NextResponse.json(await apisRequest(request)); }
