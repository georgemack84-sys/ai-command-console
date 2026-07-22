import { NextResponse } from "next/server";
import { requireSimulationUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireSimulationUser(); return NextResponse.json(await validateRequest(request)); }
