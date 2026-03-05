import { prisma } from '../../../../lib/db'
import { requireAdmin } from '../../../../lib/middleware'
import { apiRes, apiErr } from '../../../../lib/utils'

export async function PUT(req, { params }) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  const { name, desc } = await req.json()
  const brand = await prisma.brand.update({ where: { id: +params.id }, data: { name, desc } })
  return apiRes(brand)
}

export async function DELETE(req, { params }) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  await prisma.brand.delete({ where: { id: +params.id } })
  return apiRes({ ok: true })
}
