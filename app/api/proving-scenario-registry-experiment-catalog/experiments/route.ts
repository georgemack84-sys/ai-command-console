import { NextResponse } from "next/server";
import { experimentsRequest, requireProvingRegistryUser } from "../core";

export async function GET() { await requireProvingRegistryUser(); return NextResponse.json(await experimentsRequest()); }
export async function POST(request: Request) { await requireProvingRegistryUser(); return NextResponse.json(await experimentsRequest(request)); }
