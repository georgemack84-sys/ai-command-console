import { NextResponse } from "next/server";
import { forecastRequest, requireWaveFiveFinanceUser } from "../core";

export async function GET() { await requireWaveFiveFinanceUser(); return NextResponse.json(await forecastRequest()); }
export async function POST(request: Request) { await requireWaveFiveFinanceUser(); return NextResponse.json(await forecastRequest(request)); }
