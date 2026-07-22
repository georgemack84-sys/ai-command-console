import { NextResponse } from "next/server";
import { objectivesRequest, requireMissionManagementUser } from "../core";

export async function GET() { await requireMissionManagementUser(); return NextResponse.json(await objectivesRequest()); }
export async function POST(request: Request) { await requireMissionManagementUser(); return NextResponse.json(await objectivesRequest(request)); }
