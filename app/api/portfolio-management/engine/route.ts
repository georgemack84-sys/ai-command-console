import { NextResponse } from "next/server";
import { engineRequest, requirePortfolioManagementUser } from "../core";

export async function GET() { await requirePortfolioManagementUser(); return NextResponse.json(await engineRequest()); }
export async function POST(request: Request) { await requirePortfolioManagementUser(); return NextResponse.json(await engineRequest(request)); }
