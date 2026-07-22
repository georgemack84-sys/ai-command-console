import { NextResponse } from "next/server";
import { lifecycleRequest, requireProvingProvisioningUser } from "../core";

export async function GET() { await requireProvingProvisioningUser(); return NextResponse.json(await lifecycleRequest()); }
export async function POST(request: Request) { await requireProvingProvisioningUser(); return NextResponse.json(await lifecycleRequest(request)); }
