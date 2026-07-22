import { NextResponse } from "next/server";
import { requireMissionManagementUser, rulesRequest } from "../core";

export async function GET() { await requireMissionManagementUser(); return NextResponse.json(await rulesRequest()); }
export async function POST(request: Request) { await requireMissionManagementUser(); return NextResponse.json(await rulesRequest(request)); }
