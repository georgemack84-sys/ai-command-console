import { NextResponse } from "next/server";
import { exercisesRequest, requireFederationUser } from "../core";
export async function GET() { await requireFederationUser(); return NextResponse.json(await exercisesRequest()); }
export async function POST(request: Request) { await requireFederationUser(); return NextResponse.json(await exercisesRequest(request)); }
