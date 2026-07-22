import { NextResponse } from "next/server";
import { dependencyRegistryRequest, requireWaveSixDependencyServiceCoordinationUser } from "../core";

export async function GET() { await requireWaveSixDependencyServiceCoordinationUser(); return NextResponse.json(await dependencyRegistryRequest()); }
export async function POST(request: Request) { await requireWaveSixDependencyServiceCoordinationUser(); return NextResponse.json(await dependencyRegistryRequest(request)); }
