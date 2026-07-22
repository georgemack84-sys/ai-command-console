import { NextResponse } from "next/server";
import { benchmarksRequest, requireProvingRegistryUser } from "../core";

export async function GET() { await requireProvingRegistryUser(); return NextResponse.json(await benchmarksRequest()); }
export async function POST(request: Request) { await requireProvingRegistryUser(); return NextResponse.json(await benchmarksRequest(request)); }
