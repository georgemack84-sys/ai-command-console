import { NextResponse } from "next/server";
import { requireRehearsalPreparationUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireRehearsalPreparationUser(); return NextResponse.json(await validateRequest(request)); }
