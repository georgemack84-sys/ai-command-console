import { NextResponse } from "next/server";
import { requireProvingRegistryUser, validationSuitesRequest } from "../core";

export async function GET() { await requireProvingRegistryUser(); return NextResponse.json(await validationSuitesRequest()); }
export async function POST(request: Request) { await requireProvingRegistryUser(); return NextResponse.json(await validationSuitesRequest(request)); }
