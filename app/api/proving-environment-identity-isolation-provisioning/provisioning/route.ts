import { NextResponse } from "next/server";
import { provisioningRequest, requireProvingProvisioningUser } from "../core";

export async function GET() { await requireProvingProvisioningUser(); return NextResponse.json(await provisioningRequest()); }
export async function POST(request: Request) { await requireProvingProvisioningUser(); return NextResponse.json(await provisioningRequest(request)); }
