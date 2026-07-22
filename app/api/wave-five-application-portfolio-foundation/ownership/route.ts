import { NextResponse } from "next/server";
import { ownershipRequest, requireWaveFiveApplicationPortfolioFoundationUser } from "../core";

export async function GET() { await requireWaveFiveApplicationPortfolioFoundationUser(); return NextResponse.json(await ownershipRequest()); }
export async function POST(request: Request) { await requireWaveFiveApplicationPortfolioFoundationUser(); return NextResponse.json(await ownershipRequest(request)); }
