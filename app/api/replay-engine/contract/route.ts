import { NextResponse } from "next/server";
import { contractResponse, requireReplayEngineUser } from "../core";

export async function GET() { await requireReplayEngineUser(); return NextResponse.json(contractResponse()); }
