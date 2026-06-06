import { prisma } from "@/lib/prisma";

export async function checkGoalsAfterSavingsUpdate() {
  const latestSavings = await prisma.monthlySavings.findFirst({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    where: { cumulativeSavings: { gt: 0 } },
  });
  const cumulative = latestSavings ? parseFloat(latestSavings.cumulativeSavings.toString()) : 0;

  const goals = await prisma.goal.findMany({ orderBy: { sortOrder: "asc" } });

  let balance = cumulative;
  for (const goal of goals) {
    if (goal.achieved) {
      balance -= parseFloat(goal.costNeeded.toString());
      continue;
    }
    const cost = parseFloat(goal.costNeeded.toString());
    if (balance >= cost) {
      await prisma.goal.update({
        where: { id: goal.id },
        data: { achieved: true, achievedAt: new Date() },
      });
      balance -= cost;
    } else {
      break;
    }
  }
}
