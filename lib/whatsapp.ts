const DEFAULT_VERSION = "v23.0";

type WhatsAppOrder = {
  orderNumber: string;
  customerName: string;
  phone: string;
  wilaya?: string;
  notes?: string;
  itemsText: string;
  quantity: string | number;
  total: string | number;
};

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is missing`);
  }

  return value;
}

function graphUrl(path: string): string {
  const version = (
    process.env.WHATSAPP_VERSION || DEFAULT_VERSION
  ).replace(/^v/, "");

  return `https://graph.facebook.com/v${version}${path}`;
}

async function graph<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = required("WHATSAPP_ACCESS_TOKEN");

  const response = await fetch(graphUrl(path), {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
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

  return data as T;
}

export async function sendOrderTemplate(
  order: WhatsAppOrder
) {
  const phoneNumberId = required(
    "WHATSAPP_PHONE_NUMBER_ID"
  );

  const recipient = required(
    "WHATSAPP_RECIPIENT"
  ).replace(/\D/g, "");

  const templateName =
    process.env.WHATSAPP_TEMPLATE_NAME?.trim() ||
    "new_order";

  const language =
    process.env.WHATSAPP_LANGUAGE?.trim() ||
    "en";

  return graph<{
    messages?: Array<{ id: string }>;
  }>(`/${phoneNumberId}/messages`, {
    method: "POST",

    body: JSON.stringify({
      messaging_product: "whatsapp",

      to: recipient,

      type: "template",

      template: {
        name: templateName,

        language: {
          code: language,
        },

        components: [
          {
            type: "body",

            parameters: [
              {
                type: "text",
                text: String(order.orderNumber),
              },

              {
                type: "text",
                text: String(order.customerName),
              },

              {
                type: "text",
                text: String(order.phone),
              },

              {
                type: "text",
                text: String(order.itemsText),
              },

              {
                type: "text",
                text: String(order.quantity),
              },

              {
                type: "text",
                text: String(order.total),
              },
            ],
          },
        ],
      },
    }),
  });
}

export async function sendOrderImage(
  imageUrl: string,
  caption?: string
) {
  const phoneNumberId = required(
    "WHATSAPP_PHONE_NUMBER_ID"
  );

  const recipient = required(
    "WHATSAPP_RECIPIENT"
  ).replace(/\D/g, "");

  return graph<{
    messages?: Array<{ id: string }>;
  }>(`/${phoneNumberId}/messages`, {
    method: "POST",

    body: JSON.stringify({
      messaging_product: "whatsapp",

      to: recipient,

      type: "image",

      image: {
        link: imageUrl,
        ...(caption
          ? { caption }
          : {}),
      },
    }),
  });
}
