import { NextResponse } from "next/server";
import { requireWaveSixProviderConsumptionFrameworkUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveSixProviderConsumptionFrameworkUser(); return NextResponse.json(await validateRequest(request)); }
