import { NextResponse } from "next/server";
import { readinessRequest, requireCafLegionRuntimeUser } from "../core";
export async function GET() { await requireCafLegionRuntimeUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireCafLegionRuntimeUser(); return NextResponse.json(await readinessRequest(request)); }
