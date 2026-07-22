import { NextResponse } from "next/server";
import { requireProvingRegistryUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireProvingRegistryUser(); return NextResponse.json(await validateRequest(request)); }
