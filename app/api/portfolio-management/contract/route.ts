import { NextResponse } from "next/server";
import { contractResponse, requirePortfolioManagementUser } from "../core";

export async function GET() { await requirePortfolioManagementUser(); return NextResponse.json(contractResponse()); }
