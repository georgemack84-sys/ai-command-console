import { NextResponse } from "next/server";
import { contractResponse, requireContinuousProvingUser } from "../core";
export async function GET() { await requireContinuousProvingUser(); return NextResponse.json(contractResponse()); }
