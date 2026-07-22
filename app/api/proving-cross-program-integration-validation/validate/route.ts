import { NextResponse } from "next/server";
import { requireCrossProgramIntegrationUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireCrossProgramIntegrationUser(); return NextResponse.json(await validateRequest(request)); }
