import { NextResponse } from "next/server";
import { attackCatalogRequest, requireAdversarialTestingUser } from "../core";
export async function GET() { await requireAdversarialTestingUser(); return NextResponse.json(await attackCatalogRequest()); }
export async function POST(request: Request) { await requireAdversarialTestingUser(); return NextResponse.json(await attackCatalogRequest(request)); }
