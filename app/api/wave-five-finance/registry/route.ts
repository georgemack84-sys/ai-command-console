import { NextResponse } from "next/server";
import { registryRequest, requireWaveFiveFinanceUser } from "../core";

export async function GET() { await requireWaveFiveFinanceUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireWaveFiveFinanceUser(); return NextResponse.json(await registryRequest(request)); }
