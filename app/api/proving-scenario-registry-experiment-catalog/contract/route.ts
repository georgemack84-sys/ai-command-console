import { NextResponse } from "next/server";
import { contractResponse, requireProvingRegistryUser } from "../core";

export async function GET() { await requireProvingRegistryUser(); return NextResponse.json(contractResponse()); }
