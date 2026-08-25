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
}: SendOrderTemplateParams) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = process.env.WHATSAPP_RECIPIENT;
  const templateName =
    process.env.WHATSAPP_TEMPLATE_NAME || "new_order";
  const language =
    process.env.WHATSAPP_LANGUAGE || "en";

  if (!accessToken) {
    throw new Error("WHATSAPP_ACCESS_TOKEN is missing");
  }

  if (!phoneNumberId) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID is missing");
  }

  if (!recipient) {
    throw new Error("WHATSAPP_RECIPIENT is missing");
  }

  const url = graphUrl(`/${phoneNumberId}/messages`);

  const body = {
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
              text: String(orderNumber),
            },
            {
              type: "text",
              text: String(customerName),
            },
            {
              type: "text",
              text: String(phone),
            },
            {
              type: "text",
              text: String(details),
            },
            {
              type: "text",
              text: String(quantity),
            },
            {
              type: "text",
              text: String(total),
            },
          ],
        },
      ],
    },
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
