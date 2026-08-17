const DEFAULT_VERSION = 'v23.0'

function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`متغير البيئة ${name} غير مضبوط.`)
  return value
}

function graphUrl(path: string) {
  const version = (process.env.WHATSAPP_VERSION || DEFAULT_VERSION).replace(/^v/, '')
  return `https://graph.facebook.com/v${version}${path}`
}

async function graph<T>(path: string, init: RequestInit): Promise<T> {
  const token = required('WHATSAPP_ACCESS_TOKEN')
  const response = await fetch(graphUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
    cache: 'no-store',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message =
      data?.error?.message || data?.error?.error_data?.details || `WhatsApp API error (${response.status})`
    throw new Error(message)
  }
  return data as T
}

export type WhatsAppOrder = {
  orderNumber: string
  customerName: string
  phone: string
  wilaya: string
  notes: string
  itemsText: string
  quantity: number
  total: number
}

/**
 * Sends the order through the approved WhatsApp template.
 * The access token never reaches the browser.
 */
export async function sendOrderTemplate(order: WhatsAppOrder) {
  const phoneNumberId = required('WHATSAPP_PHONE_NUMBER_ID')
  const recipient = required('WHATSAPP_RECIPIENT').replace(/\D/g, '')
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim() || 'new_order'
  const language = process.env.WHATSAPP_LANGUAGE?.trim() || 'en_US'

  const details = [
    order.itemsText,
    order.wilaya ? `الولاية: ${order.wilaya}` : '',
    order.notes ? `ملاحظات: ${order.notes}` : '',
  ]
    .filter(Boolean)
    .join(' | ')
    .slice(0, 1024)

  return graph<{ messages?: Array<{ id: string }> }>(`/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: order.orderNumber },
              { type: 'text', text: order.customerName },
              { type: 'text', text: order.phone },
              { type: 'text', text: details },
              { type: 'text', text: String(order.quantity) },
              { type: 'text', text: `${order.total} دج` },
            ],
          },
        ],
      },
    }),
  })
}

/** Sends a binary image directly to WhatsApp Cloud API. */
export async function sendOrderImage(file: File) {
  const phoneNumberId = required('WHATSAPP_PHONE_NUMBER_ID')
  const recipient = required('WHATSAPP_RECIPIENT').replace(/\D/g, '')

  const body = new FormData()
  body.append('messaging_product', 'whatsapp')
  body.append('file', file, file.name || 'design.jpg')

  const media = await graph<{ id: string }>(`/${phoneNumberId}/media`, {
    method: 'POST',
    body,
  })

  return graph<{ messages?: Array<{ id: string }> }>(`/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'image',
      image: {
        id: media.id,
        caption: 'صورة تصميم البادج المخصص',
      },
    }),
  })
}
