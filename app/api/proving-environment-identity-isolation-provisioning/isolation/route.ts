import { NextResponse } from "next/server";
import { isolationRequest, requireProvingProvisioningUser } from "../core";

export async function GET() { await requireProvingProvisioningUser(); return NextResponse.json(await isolationRequest()); }
export async function POST(request: Request) { await requireProvingProvisioningUser(); return NextResponse.json(await isolationRequest(request)); }
