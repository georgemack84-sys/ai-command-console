import { NextResponse } from "next/server";
import { requireDecisionSupportUser, tradeoffsRequest } from "../core";

export async function GET() { await requireDecisionSupportUser(); return NextResponse.json(await tradeoffsRequest()); }
export async function POST(request: Request) { await requireDecisionSupportUser(); return NextResponse.json(await tradeoffsRequest(request)); }
