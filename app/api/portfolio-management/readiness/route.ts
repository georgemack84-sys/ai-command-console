import { NextResponse } from "next/server";
import { readinessRequest, requirePortfolioManagementUser } from "../core";

export async function GET() { await requirePortfolioManagementUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requirePortfolioManagementUser(); return NextResponse.json(await readinessRequest(request)); }
