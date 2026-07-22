import { NextResponse } from "next/server";
import { readinessRequest, requireProvingProvisioningUser } from "../core";

export async function GET() { await requireProvingProvisioningUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireProvingProvisioningUser(); return NextResponse.json(await readinessRequest(request)); }
