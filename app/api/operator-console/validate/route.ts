import { NextResponse } from "next/server";
import { requireOperatorConsoleUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireOperatorConsoleUser(); return NextResponse.json(await validateRequest(request)); }
