import { NextResponse } from "next/server";
import { budgetRequest, requireWaveFiveFinanceUser } from "../core";

export async function GET() { await requireWaveFiveFinanceUser(); return NextResponse.json(await budgetRequest()); }
export async function POST(request: Request) { await requireWaveFiveFinanceUser(); return NextResponse.json(await budgetRequest(request)); }
