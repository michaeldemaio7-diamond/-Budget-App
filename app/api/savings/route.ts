import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET() {
  try {
    const rows = await prisma.monthlySavings.findMany({
      orderBy: [{ year: "asc" }, { month: "asc" }],
    });
    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET /api/savings error:", error);
    return NextResponse.json({ error: "Failed to fetch savings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, actualSavingsEOM, cumulativeSavings, notes } = body;

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const row = await prisma.monthlySavings.update({
      where: { id },
      data: {
        ...(actualSavingsEOM !== undefined && { actualSavingsEOM: new Decimal(actualSavingsEOM) }),
        ...(cumulativeSavings !== undefined && { cumulativeSavings: new Decimal(cumulativeSavings) }),
        ...(notes !== undefined && { notes }),
      },
    });

    // Re-evaluate goals whenever cumulative savings changes
    if (cumulativeSavings !== undefined) {
      const { checkGoalsAfterSavingsUpdate } = await import("@/lib/checkGoals");
      await checkGoalsAfterSavingsUpdate();
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("PATCH /api/savings error:", error);
    return NextResponse.json({ error: "Failed to update savings" }, { status: 500 });
  }
}
