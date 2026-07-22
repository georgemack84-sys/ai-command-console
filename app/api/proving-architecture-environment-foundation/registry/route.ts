import { NextResponse } from "next/server";
import { registryRequest, requireProvingFoundationUser } from "../core";

export async function GET() { await requireProvingFoundationUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireProvingFoundationUser(); return NextResponse.json(await registryRequest(request)); }
