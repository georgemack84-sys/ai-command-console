import { NextResponse } from "next/server";
import { identityRegistryRequest, requireProvingProvisioningUser } from "../core";

export async function GET() { await requireProvingProvisioningUser(); return NextResponse.json(await identityRegistryRequest()); }
export async function POST(request: Request) { await requireProvingProvisioningUser(); return NextResponse.json(await identityRegistryRequest(request)); }
