import { NextResponse } from "next/server";
import { prioritizationRequest, requirePortfolioManagementUser } from "../core";

export async function GET() { await requirePortfolioManagementUser(); return NextResponse.json(await prioritizationRequest()); }
export async function POST(request: Request) { await requirePortfolioManagementUser(); return NextResponse.json(await prioritizationRequest(request)); }
