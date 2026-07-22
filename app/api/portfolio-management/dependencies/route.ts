import { NextResponse } from "next/server";
import { dependenciesRequest, requirePortfolioManagementUser } from "../core";

export async function GET() { await requirePortfolioManagementUser(); return NextResponse.json(await dependenciesRequest()); }
export async function POST(request: Request) { await requirePortfolioManagementUser(); return NextResponse.json(await dependenciesRequest(request)); }
