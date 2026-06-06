import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { checkGoalsAfterSavingsUpdate } from "@/lib/checkGoals";

export async function GET() {
  try {
    await checkGoalsAfterSavingsUpdate();
    const goals = await prisma.goal.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(goals);
  } catch (error) {
    console.error("GET /api/goals error:", error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, costNeeded, notes } = body;
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const last = await prisma.goal.findFirst({ orderBy: { sortOrder: "desc" } });
    const goal = await prisma.goal.create({
      data: {
        name,
        description: description ?? null,
        costNeeded: new Decimal(costNeeded || 0),
        notes: notes ?? null,
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("POST /api/goals error:", error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, costNeeded, notes } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(costNeeded !== undefined && { costNeeded: new Decimal(costNeeded) }),
        ...(notes !== undefined && { notes }),
      },
    });
    return NextResponse.json(goal);
  } catch (error) {
    console.error("PATCH /api/goals error:", error);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await prisma.goal.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/goals error:", error);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
