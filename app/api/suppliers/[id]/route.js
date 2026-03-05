import { prisma } from '../../../../lib/db'
import { requireAdmin } from '../../../../lib/middleware'
import { apiRes, apiErr } from '../../../../lib/utils'

export async function PUT(req, { params }) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  const data = await req.json()
  const supplier = await prisma.supplier.update({ where: { id: +params.id }, data })
  return apiRes(supplier)
}

export async function DELETE(req, { params }) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  await prisma.supplier.delete({ where: { id: +params.id } })
  return apiRes({ ok: true })
}
