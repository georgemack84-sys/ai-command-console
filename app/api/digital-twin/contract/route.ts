import { NextResponse } from "next/server";
import { contractResponse, requireDigitalTwinUser } from "../core";

export async function GET() { await requireDigitalTwinUser(); return NextResponse.json(contractResponse()); }
