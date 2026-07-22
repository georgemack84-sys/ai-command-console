import { NextResponse } from "next/server";
import { queryRequest, requireDigitalTwinUser } from "../core";

export async function GET() { await requireDigitalTwinUser(); return NextResponse.json(await queryRequest()); }
export async function POST(request: Request) { await requireDigitalTwinUser(); return NextResponse.json(await queryRequest(request)); }
