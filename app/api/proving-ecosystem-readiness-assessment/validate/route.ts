import { NextResponse } from "next/server";
import { requireEcosystemReadinessUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireEcosystemReadinessUser(); return NextResponse.json(await validateRequest(request)); }
