import { NextResponse } from "next/server";
import { notificationsRequest, requireOperatorConsoleUser } from "../core";

export async function GET() { await requireOperatorConsoleUser(); return NextResponse.json(await notificationsRequest()); }
export async function POST(request: Request) { await requireOperatorConsoleUser(); return NextResponse.json(await notificationsRequest(request)); }
