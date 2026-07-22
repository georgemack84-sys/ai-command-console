import { NextResponse } from "next/server";
import { requireProvingFoundationUser, servicesRequest } from "../core";

export async function GET() { await requireProvingFoundationUser(); return NextResponse.json(await servicesRequest()); }
export async function POST(request: Request) { await requireProvingFoundationUser(); return NextResponse.json(await servicesRequest(request)); }
