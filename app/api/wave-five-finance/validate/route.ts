import { NextResponse } from "next/server";
import { requireWaveFiveFinanceUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveFiveFinanceUser(); return NextResponse.json(await validateRequest(request)); }
