import { prisma } from '../../../../lib/db'
import { requireAdmin } from '../../../../lib/middleware'
import { apiRes, apiErr } from '../../../../lib/utils'

// DELETE /api/transactions/[id] or /api/transactions/all
export async function DELETE(req, { params }) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  if (params.id === 'all') {
    await prisma.transactionItem.deleteMany({})
    await prisma.transaction.deleteMany({})
    return apiRes({ ok: true })
  }
  await prisma.transactionItem.deleteMany({ where: { transactionId: params.id } })
  await prisma.transaction.delete({ where: { id: params.id } })
  return apiRes({ ok: true })
}
