import { NextResponse } from "next/server";
import { requireWaveFiveApplicationPortfolioFoundationUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveFiveApplicationPortfolioFoundationUser(); return NextResponse.json(await validateRequest(request)); }
