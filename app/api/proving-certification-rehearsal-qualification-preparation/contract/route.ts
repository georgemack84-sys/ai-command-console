import { NextResponse } from "next/server";
import { contractResponse, requireRehearsalPreparationUser } from "../core";
export async function GET() { await requireRehearsalPreparationUser(); return NextResponse.json(contractResponse()); }
