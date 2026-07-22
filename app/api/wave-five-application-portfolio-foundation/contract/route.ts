import { NextResponse } from "next/server";
import { contractResponse, requireWaveFiveApplicationPortfolioFoundationUser } from "../core";

export async function GET() { await requireWaveFiveApplicationPortfolioFoundationUser(); return NextResponse.json(contractResponse()); }
