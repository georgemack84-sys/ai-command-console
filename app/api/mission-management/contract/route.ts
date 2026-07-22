import { NextResponse } from "next/server";
import { contractResponse, requireMissionManagementUser } from "../core";

export async function GET() { await requireMissionManagementUser(); return NextResponse.json(contractResponse()); }
