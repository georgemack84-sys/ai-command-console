import { NextResponse } from "next/server";
import { contractResponse, requireProvingFoundationUser } from "../core";

export async function GET() { await requireProvingFoundationUser(); return NextResponse.json(contractResponse()); }
