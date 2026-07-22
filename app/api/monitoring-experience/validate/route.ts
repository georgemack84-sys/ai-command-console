import { NextResponse } from "next/server";
import { requireMonitoringExperienceUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireMonitoringExperienceUser(); return NextResponse.json(await validateRequest(request)); }
