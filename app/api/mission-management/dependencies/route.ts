import { NextResponse } from "next/server";
import { dependenciesRequest, requireMissionManagementUser } from "../core";

export async function GET() { await requireMissionManagementUser(); return NextResponse.json(await dependenciesRequest()); }
export async function POST(request: Request) { await requireMissionManagementUser(); return NextResponse.json(await dependenciesRequest(request)); }
