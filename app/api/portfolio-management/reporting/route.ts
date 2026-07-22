import { NextResponse } from "next/server";
import { reportingRequest, requirePortfolioManagementUser } from "../core";

export async function GET() { await requirePortfolioManagementUser(); return NextResponse.json(await reportingRequest()); }
export async function POST(request: Request) { await requirePortfolioManagementUser(); return NextResponse.json(await reportingRequest(request)); }
