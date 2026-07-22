import { NextResponse } from "next/server";
import { requireProvingProvisioningUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireProvingProvisioningUser(); return NextResponse.json(await validateRequest(request)); }
