import { NextResponse } from "next/server";
import { registryRequest, requirePortfolioManagementUser } from "../core";

export async function GET() { await requirePortfolioManagementUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requirePortfolioManagementUser(); return NextResponse.json(await registryRequest(request)); }
