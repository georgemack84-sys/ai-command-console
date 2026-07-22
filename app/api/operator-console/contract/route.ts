import { NextResponse } from "next/server";
import { contractResponse, requireOperatorConsoleUser } from "../core";

export async function GET() { await requireOperatorConsoleUser(); return NextResponse.json(contractResponse()); }
