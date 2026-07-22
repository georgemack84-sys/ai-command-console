import { NextResponse } from "next/server";
import { conflictsRequest, requirePortfolioManagementUser } from "../core";

export async function GET() { await requirePortfolioManagementUser(); return NextResponse.json(await conflictsRequest()); }
export async function POST(request: Request) { await requirePortfolioManagementUser(); return NextResponse.json(await conflictsRequest(request)); }
