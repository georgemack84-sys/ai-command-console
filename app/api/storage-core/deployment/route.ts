import { NextResponse } from "next/server";
import { deploymentRequest, requireStorageCoreUser } from "../core";
export async function GET() { await requireStorageCoreUser(); return NextResponse.json(await deploymentRequest()); }
export async function POST(request: Request) { await requireStorageCoreUser(); return NextResponse.json(await deploymentRequest(request)); }
