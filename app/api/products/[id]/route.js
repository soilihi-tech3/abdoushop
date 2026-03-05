import { prisma } from '../../../../lib/db'
import { requireAuth, requireAdmin } from '../../../../lib/middleware'
import { apiRes, apiErr } from '../../../../lib/utils'

export async function GET(req, { params }) {
  const session = await requireAuth(req)
  if (!session) return apiErr('Non authentifié', 401)
  const product = await prisma.product.findUnique({
    where: { id: +params.id },
    include: { brand: true, category: true, supplier: true }
  })
  if (!product) return apiErr('Produit introuvable', 404)
  return apiRes(product)
}

export async function PUT(req, { params }) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  const { name, brandId, categoryId, buyPrice, sellPrice, qty,
          imei, storage, state, color, supplierId, desc, photo } = await req.json()
  const product = await prisma.product.update({
    where: { id: +params.id },
    data: {
      ...(name && { name }),
      ...(brandId && { brandId: +brandId }),
      ...(categoryId && { categoryId: +categoryId }),
      ...(buyPrice && { buyPrice: +buyPrice }),
      ...(sellPrice && { sellPrice: +sellPrice }),
      ...(qty !== undefined && qty !== null && { qty: +qty }),
      ...(supplierId ? { supplierId: +supplierId } : { supplierId: null }),
      ...(imei !== undefined && { imei: imei || null }),
      ...(storage !== undefined && { storage: storage || null }),
      ...(state && { state }),
      ...(color !== undefined && { color: color || null }),
      ...(desc !== undefined && { desc: desc || null }),
      ...(photo !== undefined && { photo: photo || null }),
    },
    include: { brand: true, category: true, supplier: true }
  })
  return apiRes(product)
}

export async function DELETE(req, { params }) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  await prisma.product.delete({ where: { id: +params.id } })
  return apiRes({ ok: true })
}
