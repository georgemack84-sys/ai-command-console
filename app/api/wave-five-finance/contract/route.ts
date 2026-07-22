import { NextResponse } from "next/server";
import { contractResponse, requireWaveFiveFinanceUser } from "../core";

export async function GET() { await requireWaveFiveFinanceUser(); return NextResponse.json(contractResponse()); }
