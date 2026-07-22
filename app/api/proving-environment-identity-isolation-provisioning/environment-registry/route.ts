import { NextResponse } from "next/server";
import { environmentRegistryRequest, requireProvingProvisioningUser } from "../core";

export async function GET() { await requireProvingProvisioningUser(); return NextResponse.json(await environmentRegistryRequest()); }
export async function POST(request: Request) { await requireProvingProvisioningUser(); return NextResponse.json(await environmentRegistryRequest(request)); }
