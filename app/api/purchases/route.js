import { prisma } from '../../../lib/db'
import { requireAuth, requireAdmin } from '../../../lib/middleware'
import { apiRes, apiErr } from '../../../lib/utils'

export async function GET(req) {
  const session = await requireAuth(req)
  if (!session) return apiErr('Non authentifié', 401)
  const purchases = await prisma.purchase.findMany({
    include: { supplier: true, product: { include: { brand: true, category: true } } },
    orderBy: { date: 'desc' }
  })
  return apiRes(purchases.map(p=>({...p,unitPrice:p.price})))
}

export async function POST(req) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  const { productId, qty, unitPrice, price, supplierId, date } = await req.json()
  const unitP = unitPrice || price
  if (!productId || !qty || !unitP) return apiErr('Champs manquants')
  // Update product stock
  await prisma.product.update({ where: { id: +productId }, data: { qty: { increment: +qty } } })
  const purchase = await prisma.purchase.create({
    data: { productId: +productId, prodName: (await prisma.product.findUnique({where:{id:+productId},select:{name:true}}))?.name||"—", qty: +qty, price: +unitP, supplierId: supplierId ? +supplierId : null, date: date ? new Date(date) : new Date() },
    include: { supplier: true, product: { include: { brand: true, category: true } } }
  })
  return apiRes(purchase, 201)
}
