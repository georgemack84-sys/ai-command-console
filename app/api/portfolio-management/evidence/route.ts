import { NextResponse } from "next/server";
import { evidenceRequest, requirePortfolioManagementUser } from "../core";

export async function GET() { await requirePortfolioManagementUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requirePortfolioManagementUser(); return NextResponse.json(await evidenceRequest(request)); }
