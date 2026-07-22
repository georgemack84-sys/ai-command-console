import { NextResponse } from "next/server";
import { notificationsAnalyticsRequest, requireWaveFiveCalendarTimeUser } from "../core";

export async function GET() { await requireWaveFiveCalendarTimeUser(); return NextResponse.json(await notificationsAnalyticsRequest()); }
export async function POST(request: Request) { await requireWaveFiveCalendarTimeUser(); return NextResponse.json(await notificationsAnalyticsRequest(request)); }
