import { NextResponse } from "next/server";
import { contractResponse, requireProvingProvisioningUser } from "../core";

export async function GET() { await requireProvingProvisioningUser(); return NextResponse.json(contractResponse()); }
