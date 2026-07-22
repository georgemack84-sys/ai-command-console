import { NextResponse } from "next/server";
import { requireCafLegionRuntimeUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireCafLegionRuntimeUser(); return NextResponse.json(await validateRequest(request)); }
