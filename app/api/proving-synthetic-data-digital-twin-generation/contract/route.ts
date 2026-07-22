import { NextResponse } from "next/server";
import { contractResponse, requireSyntheticGenerationUser } from "../core";

export async function GET() { await requireSyntheticGenerationUser(); return NextResponse.json(contractResponse()); }
