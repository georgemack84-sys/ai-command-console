import { NextResponse } from "next/server";
import { certificationRequest, requireCafLegionRuntimeUser } from "../core";
export async function GET() { await requireCafLegionRuntimeUser(); return NextResponse.json(await certificationRequest()); }
export async function POST(request: Request) { await requireCafLegionRuntimeUser(); return NextResponse.json(await certificationRequest(request)); }
