import { NextResponse } from "next/server";
import { lifecycleRequest, requireWaveFiveApplicationPortfolioFoundationUser } from "../core";

export async function GET() { await requireWaveFiveApplicationPortfolioFoundationUser(); return NextResponse.json(await lifecycleRequest()); }
export async function POST(request: Request) { await requireWaveFiveApplicationPortfolioFoundationUser(); return NextResponse.json(await lifecycleRequest(request)); }
