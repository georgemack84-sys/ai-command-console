import { NextResponse } from "next/server";
import { evidenceRequest, requireCafLegionRuntimeUser } from "../core";
export async function GET() { await requireCafLegionRuntimeUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireCafLegionRuntimeUser(); return NextResponse.json(await evidenceRequest(request)); }
