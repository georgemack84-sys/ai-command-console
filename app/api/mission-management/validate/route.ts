import { NextResponse } from "next/server";
import { requireMissionManagementUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireMissionManagementUser(); return NextResponse.json(await validateRequest(request)); }
