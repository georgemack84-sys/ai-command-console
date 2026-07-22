import { NextResponse } from "next/server";
import { requirePortfolioManagementUser, scaleRequest } from "../core";

export async function GET() { await requirePortfolioManagementUser(); return NextResponse.json(await scaleRequest()); }
export async function POST(request: Request) { await requirePortfolioManagementUser(); return NextResponse.json(await scaleRequest(request)); }
