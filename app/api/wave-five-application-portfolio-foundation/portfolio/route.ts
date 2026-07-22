import { NextResponse } from "next/server";
import { portfolioRequest, requireWaveFiveApplicationPortfolioFoundationUser } from "../core";

export async function GET() { await requireWaveFiveApplicationPortfolioFoundationUser(); return NextResponse.json(await portfolioRequest()); }
export async function POST(request: Request) { await requireWaveFiveApplicationPortfolioFoundationUser(); return NextResponse.json(await portfolioRequest(request)); }
