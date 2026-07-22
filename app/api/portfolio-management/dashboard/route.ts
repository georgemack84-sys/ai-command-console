import { NextResponse } from "next/server";
import { dashboardRequest, requirePortfolioManagementUser } from "../core";

export async function GET() { await requirePortfolioManagementUser(); return NextResponse.json(await dashboardRequest()); }
export async function POST(request: Request) { await requirePortfolioManagementUser(); return NextResponse.json(await dashboardRequest(request)); }
