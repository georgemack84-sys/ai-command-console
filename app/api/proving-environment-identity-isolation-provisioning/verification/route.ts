import { NextResponse } from "next/server";
import { requireProvingProvisioningUser, verificationRequest } from "../core";

export async function GET() { await requireProvingProvisioningUser(); return NextResponse.json(await verificationRequest()); }
export async function POST(request: Request) { await requireProvingProvisioningUser(); return NextResponse.json(await verificationRequest(request)); }
