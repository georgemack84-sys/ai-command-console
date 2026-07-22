import { NextResponse } from "next/server";
import { requireProvingRegistryUser, searchRequest } from "../core";

export async function GET() { await requireProvingRegistryUser(); return NextResponse.json(await searchRequest()); }
export async function POST(request: Request) { await requireProvingRegistryUser(); return NextResponse.json(await searchRequest(request)); }
