import { prisma } from '../../../lib/db'
import { requireAuth } from '../../../lib/middleware'
import { apiRes, apiErr } from '../../../lib/utils'

export async function GET(req) {
  const session = await requireAuth(req)
  if (!session) return apiErr('Non authentifié', 401)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    allTx, monthTx, lastMonthTx,
    products, recentTx
  ] = await Promise.all([
    prisma.transaction.findMany({ select: { amount: true, type: true } }),
    prisma.transaction.findMany({
      where: { date: { gte: startOfMonth } },
      select: { amount: true, type: true, payment: true }
    }),
    prisma.transaction.findMany({
      where: { date: { gte: startOfLastMonth, lte: endOfLastMonth } },
      select: { amount: true, type: true }
    }),
    prisma.product.findMany({ select: { buyPrice: true, sellPrice: true, qty: true } }),
    prisma.transaction.findMany({
      take: 8,
      orderBy: { date: 'desc' },
      include: { items: true, employee: { select: { first: true, last: true } } }
    })
  ])

  const monthSales = monthTx.filter(t => t.type === 'vente')
  const monthExchanges = monthTx.filter(t => t.type === 'échange')
  const lastMonthRevenue = lastMonthTx.filter(t => t.type === 'vente').reduce((a, t) => a + t.amount, 0)
  const thisMonthRevenue = monthSales.reduce((a, t) => a + t.amount, 0)
  const totalRevenue = allTx.filter(t => t.type === 'vente').reduce((a, t) => a + t.amount, 0)
  const stockValue = products.reduce((a, p) => a + p.buyPrice * p.qty, 0)
  const lowStock = products.filter(p => p.qty <= 2).length

  return apiRes({
    kpis: {
      revenue: thisMonthRevenue,
      revenuePct: lastMonthRevenue ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : null,
      salesCount: monthSales.length,
      exchangeCount: monthExchanges.length,
      lowStock,
      totalProducts: products.length,
      totalRevenue,
      stockValue,
      totalTx: allTx.length,
    },
    recentTx,
  })
}
