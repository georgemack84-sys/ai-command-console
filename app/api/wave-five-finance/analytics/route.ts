import { NextResponse } from "next/server";
import { analyticsRequest, requireWaveFiveFinanceUser } from "../core";

export async function GET() { await requireWaveFiveFinanceUser(); return NextResponse.json(await analyticsRequest()); }
export async function POST(request: Request) { await requireWaveFiveFinanceUser(); return NextResponse.json(await analyticsRequest(request)); }
