import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: 1 } });
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      alertEmail,
      taxRate,
      wifeSalaryGross,
      job1SalaryGross,
      job2SalaryGross,
      wifePayFrequency,
      job1PayFrequency,
      job2PayFrequency,
      wifeFirstPayDate,
      job1FirstPayDate,
      wifeNetPaycheck,
      job1NetPaycheck,
      job2NetPaycheck,
      gmailAccount1,
      gmailAccount2,
      gmailToken1,
      gmailToken2,
    } = body;

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        ...(alertEmail !== undefined && { alertEmail }),
        ...(taxRate !== undefined && { taxRate: new Decimal(taxRate) }),
        ...(wifeSalaryGross !== undefined && { wifeSalaryGross: new Decimal(wifeSalaryGross) }),
        ...(job1SalaryGross !== undefined && { job1SalaryGross: new Decimal(job1SalaryGross) }),
        ...(job2SalaryGross !== undefined && { job2SalaryGross: new Decimal(job2SalaryGross) }),
        ...(wifePayFrequency !== undefined && { wifePayFrequency }),
        ...(job1PayFrequency !== undefined && { job1PayFrequency }),
        ...(job2PayFrequency !== undefined && { job2PayFrequency }),
        ...(wifeFirstPayDate !== undefined && { wifeFirstPayDate }),
        ...(job1FirstPayDate !== undefined && { job1FirstPayDate }),
        ...(wifeNetPaycheck !== undefined && { wifeNetPaycheck: new Decimal(wifeNetPaycheck) }),
        ...(job1NetPaycheck !== undefined && { job1NetPaycheck: new Decimal(job1NetPaycheck) }),
        ...(job2NetPaycheck !== undefined && { job2NetPaycheck: new Decimal(job2NetPaycheck) }),
        ...(gmailAccount1 !== undefined && { gmailAccount1 }),
        ...(gmailAccount2 !== undefined && { gmailAccount2 }),
        ...(gmailToken1 !== undefined && { gmailToken1 }),
        ...(gmailToken2 !== undefined && { gmailToken2 }),
      },
      create: { id: 1 },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("PATCH /api/settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
