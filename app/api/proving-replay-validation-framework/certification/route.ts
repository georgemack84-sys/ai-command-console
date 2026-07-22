import { NextResponse } from "next/server";
import { certificationRequest, requireReplayValidationUser } from "../core";
export async function GET() { await requireReplayValidationUser(); return NextResponse.json(await certificationRequest()); }
export async function POST(request: Request) { await requireReplayValidationUser(); return NextResponse.json(await certificationRequest(request)); }
