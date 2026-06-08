const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const a = await p.budgetRow.updateMany({ where: { label: 'Kai Rent' }, data: { budgetAmount: 575, actualAmount: 575 } });
  const b = await p.budgetRow.updateMany({ where: { label: 'Kai Credit Card' }, data: { budgetAmount: 1000 } });
  console.log('Kai Rent updated:', a.count, 'rows');
  console.log('Kai Credit Card updated:', b.count, 'rows');
  await p.$disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
