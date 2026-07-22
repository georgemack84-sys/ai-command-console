import { NextResponse } from "next/server";
import { healthRequest, requirePortfolioManagementUser } from "../core";

export async function GET() { await requirePortfolioManagementUser(); return NextResponse.json(await healthRequest()); }
export async function POST(request: Request) { await requirePortfolioManagementUser(); return NextResponse.json(await healthRequest(request)); }
