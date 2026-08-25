const DEFAULT_VERSION = "v23.0";

function graphUrl(path: string) {
  const version = (process.env.WHATSAPP_VERSION || DEFAULT_VERSION).replace(
    /^v/,
    ""
  );
  

  return `https://graph.facebook.com/v${version}${path}`;
}

type SendOrderTemplateParams = {
  orderNumber: string;
  customerName: string;
  phone: string;
  details: string;
  quantity: string | number;
  total: string | number;
};

export async function sendOrderTemplate({
  orderNumber,
  customerName,
  phone,
  details,
  quantity,
  total,
}: export async function sendOrderTemplate(order: WhatsAppOrder) {
  const phoneNumberId = required('WHATSAPP_PHONE_NUMBER_ID')
  const recipient = required('WHATSAPP_RECIPIENT').replace(/\D/g, '')
  const templateName =
    process.env.WHATSAPP_TEMPLATE_NAME?.trim() || 'new_order'

  const language =
    process.env.WHATSAPP_LANGUAGE?.trim() || 'en'

  return graph<{ messages?: Array<{ id: string }> }>(
    `/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'template',

        template: {
          name: templateName,

          language: {
            code: language,
          },

          components: [
            {
              type: 'body',

              parameters: [
                {
                  type: 'text',
                  text: String(order.orderNumber),
                },
                {
                  type: 'text',
                  text: String(order.customerName),
                },
                {
                  type: 'text',
                  text: String(order.phone),
                },
                {
                  type: 'text',
                  text: String(order.itemsText),
                },
                {
                  type: 'text',
                  text: String(order.quantity),
                },
                {
                  type: 'text',
                  text: String(order.total),
                },
              ],
            },
          ],
        },
      }),
    }
  )
};

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("WhatsApp API Error:", data);

    const errorMessage =
      data?.error?.message ||
      data?.error?.error_user_msg ||
      "Unknown WhatsApp API error";

    throw new Error(
      `WhatsApp API Error: ${errorMessage}`
    );
  }

  return data;
}
