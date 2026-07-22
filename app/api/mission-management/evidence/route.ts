import { NextResponse } from "next/server";
import { evidenceRequest, requireMissionManagementUser } from "../core";

export async function GET() { await requireMissionManagementUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireMissionManagementUser(); return NextResponse.json(await evidenceRequest(request)); }
