import { NextResponse } from "next/server";
import { requireReplayValidationUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireReplayValidationUser(); return NextResponse.json(await validateRequest(request)); }
