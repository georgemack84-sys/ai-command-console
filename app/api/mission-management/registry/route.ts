import { NextResponse } from "next/server";
import { registryRequest, requireMissionManagementUser } from "../core";

export async function GET() { await requireMissionManagementUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireMissionManagementUser(); return NextResponse.json(await registryRequest(request)); }
