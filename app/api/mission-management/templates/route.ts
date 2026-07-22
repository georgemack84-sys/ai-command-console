import { NextResponse } from "next/server";
import { requireMissionManagementUser, templatesRequest } from "../core";

export async function GET() { await requireMissionManagementUser(); return NextResponse.json(await templatesRequest()); }
export async function POST(request: Request) { await requireMissionManagementUser(); return NextResponse.json(await templatesRequest(request)); }
