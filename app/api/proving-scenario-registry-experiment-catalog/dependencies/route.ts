import { NextResponse } from "next/server";
import { dependenciesRequest, requireProvingRegistryUser } from "../core";

export async function GET() { await requireProvingRegistryUser(); return NextResponse.json(await dependenciesRequest()); }
export async function POST(request: Request) { await requireProvingRegistryUser(); return NextResponse.json(await dependenciesRequest(request)); }
