import { NextResponse } from "next/server";
import { requireProvingRegistryUser, scenariosRequest } from "../core";

export async function GET() { await requireProvingRegistryUser(); return NextResponse.json(await scenariosRequest()); }
export async function POST(request: Request) { await requireProvingRegistryUser(); return NextResponse.json(await scenariosRequest(request)); }
