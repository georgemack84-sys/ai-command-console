import { NextResponse } from "next/server";
import { contractResponse, requireOperatorDashboardUser } from "../core";

export async function GET() { await requireOperatorDashboardUser(); return NextResponse.json(contractResponse()); }
