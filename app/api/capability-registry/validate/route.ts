import { NextResponse } from "next/server";
import { requireCapabilityRegistryUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireCapabilityRegistryUser(); return NextResponse.json(await validateRequest(request)); }
