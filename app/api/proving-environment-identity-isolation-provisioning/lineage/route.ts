import { NextResponse } from "next/server";
import { lineageRequest, requireProvingProvisioningUser } from "../core";

export async function GET() { await requireProvingProvisioningUser(); return NextResponse.json(await lineageRequest()); }
export async function POST(request: Request) { await requireProvingProvisioningUser(); return NextResponse.json(await lineageRequest(request)); }
