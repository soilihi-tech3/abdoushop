export const fmt = (n) =>
  Number(n || 0).toLocaleString('fr-FR') + ' FCFA'

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

export const fmtDateTime = (d) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export function apiRes(data, status = 200) {
  return Response.json(data, { status })
}

export function apiErr(msg, status = 400) {
  return Response.json({ error: msg }, { status })
}
