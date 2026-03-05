import { prisma } from '../../../lib/db'
import { requireAuth } from '../../../lib/middleware'
import { apiRes, apiErr } from '../../../lib/utils'

export async function GET(req) {
  const session = await requireAuth(req)
  if (!session) return apiErr('Non authentifié', 401)
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const where = {}
  if (session.role !== 'admin') where.employeeId = session.id
  if (type) where.type = type
  if (from || to) { where.date = {}; if (from) where.date.gte = new Date(from); if (to) where.date.lte = new Date(to) }
  const txs = await prisma.transaction.findMany({
    where,
    include: { items: true, employee: { select: { first: true, last: true } } },
    orderBy: { date: 'desc' }
  })
  return apiRes(txs.map(t => ({
    ...t,
    employee: t.employee ? t.employee.first+" "+t.employee.last : "" || '',
    items: t.items.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price, imei: i.imei, productId: i.productId }))
  })))
}

export async function POST(req) {
  const session = await requireAuth(req)
  if (!session) return apiErr('Non authentifié', 401)
  const data = await req.json()
  const { client, phone, type, payment, payDetails, amount, discount = 0, subtotal, items,
          oldPhone, oldPhoneImei, oldPhoneCond, oldPhoneVal,
          newPhoneName, newPhoneImei, newPhoneStorage } = data
  if (!client || !type || !payment || amount == null || !items?.length) return apiErr('Données manquantes')
  for (const item of items) {
    if (item.productId) {
      await prisma.product.update({ where: { id: +item.productId }, data: { qty: { decrement: item.qty || 1 } } })
    }
  }
  const txData = {
    client, phone: phone||null, type, payment,
    amount: +amount, discount: +discount, subtotal: +(subtotal||amount),
    employeeId: session.id,
    oldPhone: oldPhone||null, oldPhoneImei: oldPhoneImei||null, oldPhoneCond: oldPhoneCond||null,
    newPhoneName: newPhoneName||null, newPhoneImei: newPhoneImei||null, newPhoneStorage: newPhoneStorage||null,
    items: { create: items.map(i => ({ name: i.name, qty: i.qty||1, price: +i.price, imei: i.imei||null })) }
  }
  // Add new optional fields if schema supports them
  try { if (payDetails) txData.payDetails = JSON.stringify(payDetails) } catch {}
  try { if (oldPhoneVal) txData.oldPhoneVal = +oldPhoneVal } catch {}
  const tx = await prisma.transaction.create({
    data: txData,
    include: { items: true, employee: { select: { first: true, last: true } } }
  })
  return apiRes({ ...tx, employee: tx.employee ? (tx.employee.first+' '+tx.employee.last) : '', items: tx.items }, 201)
}
