import { NextResponse } from "next/server";
import { requireDigitalTwinUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireDigitalTwinUser(); return NextResponse.json(await validateRequest(request)); }
