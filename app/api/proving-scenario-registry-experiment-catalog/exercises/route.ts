import { NextResponse } from "next/server";
import { exercisesRequest, requireProvingRegistryUser } from "../core";

export async function GET() { await requireProvingRegistryUser(); return NextResponse.json(await exercisesRequest()); }
export async function POST(request: Request) { await requireProvingRegistryUser(); return NextResponse.json(await exercisesRequest(request)); }
