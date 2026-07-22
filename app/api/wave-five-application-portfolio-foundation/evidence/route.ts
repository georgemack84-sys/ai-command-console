import { NextResponse } from "next/server";
import { evidenceRequest, requireWaveFiveApplicationPortfolioFoundationUser } from "../core";

export async function GET() { await requireWaveFiveApplicationPortfolioFoundationUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireWaveFiveApplicationPortfolioFoundationUser(); return NextResponse.json(await evidenceRequest(request)); }
