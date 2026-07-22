import { NextResponse } from "next/server";
import { requireProvingProvisioningUser, retirementRequest } from "../core";

export async function GET() { await requireProvingProvisioningUser(); return NextResponse.json(await retirementRequest()); }
export async function POST(request: Request) { await requireProvingProvisioningUser(); return NextResponse.json(await retirementRequest(request)); }
