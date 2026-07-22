import { NextResponse } from "next/server";
import { requirePortfolioManagementUser, validateRequest } from "../core";

export async function POST(request: Request) { await requirePortfolioManagementUser(); return NextResponse.json(await validateRequest(request)); }
