import { prisma } from '../../../lib/db'
import { requireAuth, requireAdmin } from '../../../lib/middleware'
import { apiRes, apiErr } from '../../../lib/utils'

// GET /api/products
export async function GET(req) {
  const session = await requireAuth(req)
  if (!session) return apiErr('Non authentifié', 401)

  const products = await prisma.product.findMany({
    include: { brand: true, category: true, supplier: true },
    orderBy: { name: 'asc' }
  })
  return apiRes(products)
}

// POST /api/products
export async function POST(req) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)

  const data = await req.json()
  const { name, brandId, categoryId, buyPrice, sellPrice, qty = 0,
          imei, storage, state, color, supplierId, desc, photo } = data

  if (!name || !brandId || !categoryId || !buyPrice || !sellPrice)
    return apiErr('Champs obligatoires manquants')

  const product = await prisma.product.create({
    data: {
      name,
      brandId: +brandId,
      categoryId: +categoryId,
      buyPrice: +buyPrice,
      sellPrice: +sellPrice,
      qty: +qty,
      ...(imei && { imei }),
      ...(storage && { storage }),
      ...(state && { state }),
      ...(color && { color }),
      ...(supplierId && { supplierId: +supplierId }),
      ...(desc && { desc }),
      ...(photo && { photo }),
    },
    include: { brand: true, category: true, supplier: true }
  })
  return apiRes(product, 201)
}
