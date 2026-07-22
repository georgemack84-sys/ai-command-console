import { NextResponse } from "next/server";
import { analyticsRequest, requirePortfolioManagementUser } from "../core";

export async function GET() { await requirePortfolioManagementUser(); return NextResponse.json(await analyticsRequest()); }
export async function POST(request: Request) { await requirePortfolioManagementUser(); return NextResponse.json(await analyticsRequest(request)); }
