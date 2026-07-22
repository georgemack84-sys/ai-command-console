import { NextResponse } from "next/server";
import { requireCertificationEngineUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireCertificationEngineUser(); return NextResponse.json(await validateRequest(request)); }
