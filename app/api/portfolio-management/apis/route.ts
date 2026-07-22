import { NextResponse } from "next/server";
import { apisRequest, requirePortfolioManagementUser } from "../core";

export async function GET() { await requirePortfolioManagementUser(); return NextResponse.json(await apisRequest()); }
export async function POST(request: Request) { await requirePortfolioManagementUser(); return NextResponse.json(await apisRequest(request)); }
