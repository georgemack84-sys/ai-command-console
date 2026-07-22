import { NextResponse } from "next/server";
import { dependenciesRequest, requireWaveFiveApplicationPortfolioFoundationUser } from "../core";

export async function GET() { await requireWaveFiveApplicationPortfolioFoundationUser(); return NextResponse.json(await dependenciesRequest()); }
export async function POST(request: Request) { await requireWaveFiveApplicationPortfolioFoundationUser(); return NextResponse.json(await dependenciesRequest(request)); }
