import { NextResponse } from "next/server";
import { contractResponse, requireDecisionSupportUser } from "../core";

export async function GET() { await requireDecisionSupportUser(); return NextResponse.json(contractResponse()); }
