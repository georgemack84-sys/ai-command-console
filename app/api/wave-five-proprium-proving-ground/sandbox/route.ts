import { NextResponse } from "next/server";
import { requireWaveFiveProvingGroundUser, sandboxRequest } from "../core";

export async function GET() { await requireWaveFiveProvingGroundUser(); return NextResponse.json(await sandboxRequest()); }
export async function POST(request: Request) { await requireWaveFiveProvingGroundUser(); return NextResponse.json(await sandboxRequest(request)); }
