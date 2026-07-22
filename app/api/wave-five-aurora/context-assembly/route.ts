import { NextResponse } from "next/server";
import { contextAssemblyRequest, requireWaveFiveAuroraUser } from "../core";

export async function GET() { await requireWaveFiveAuroraUser(); return NextResponse.json(await contextAssemblyRequest()); }
export async function POST(request: Request) { await requireWaveFiveAuroraUser(); return NextResponse.json(await contextAssemblyRequest(request)); }
