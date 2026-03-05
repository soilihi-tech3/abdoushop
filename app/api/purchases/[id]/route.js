import { prisma } from '../../../../lib/db'
import { requireAdmin } from '../../../../lib/middleware'
import { apiRes, apiErr } from '../../../../lib/utils'

export async function DELETE(req, { params }) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  await prisma.purchase.delete({ where: { id: +params.id } })
  return apiRes({ ok: true })
}
