const DEFAULT_VERSION = "v23.0";

export type WhatsAppOrder = {
  orderNumber: string;
  customerName: string;
  phone: string;
  wilaya: string;
  notes: string;
  itemsText: string;
  quantity: number;
  total: number;
};

/**
 * Get a required environment variable.
 */
function required(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Environment variable ${name} is missing`);
  }

  return value;
}

/**
 * Build WhatsApp Graph API URL.
 */
function graphUrl(path: string): string {
  const version = (
    process.env.WHATSAPP_VERSION || DEFAULT_VERSION
  ).replace(/^v/, "");

  return `https://graph.facebook.com/v${version}${path}`;
}

/**
 * Generic WhatsApp Graph API request.
 *
 * Important:
 * We only add Content-Type: application/json when the body
 * is JSON. For FormData uploads, fetch must generate the
 * multipart boundary automatically.
 */
async function graph<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = required("WHATSAPP_ACCESS_TOKEN");

  const headers = new Headers(options.headers);

  headers.set("Authorization", `Bearer ${accessToken}`);

  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(graphUrl(path), {
    ...options,
    headers,
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("[WhatsApp API]", {
      status: response.status,
      data,
    });

    const errorMessage =
      data?.error?.message ||
      data?.error?.error_user_msg ||
      data?.error?.error_data?.details ||
      `WhatsApp API error (${response.status})`;

    throw new Error(errorMessage);
  }

  return data as T;
}

/**
 * Send the approved WhatsApp template.
 *
 * Template:
 *
 * new_order
 * Language: en
 *
 * {{1}} Order number
 * {{2}} Customer
 * {{3}} Phone
 * {{4}} Product
 * {{5}} Quantity
 * {{6}} Total
 */
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

  /**
   * IMPORTANT:
   *
   * Your Meta template currently has:
   * Header = Image
   *
   * Therefore we MUST send a header image.
   *
   * Put your image inside:
   *
   * public/souhbadz-logo.png
   *
   * and make sure the production domain below is correct.
   */

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!siteUrl) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is missing"
    );
  }

  const headerImageUrl =
    `${siteUrl.replace(/\/$/, "")}/souhbadz-logo.png`;

  return graph<{
    messages?: Array<{
      id: string;
    }>;
  }>(
    `/${phoneNumberId}/messages`,
    {
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
            /**
             * IMAGE HEADER
             */
            {
              type: "header",

              parameters: [
                {
                  type: "image",

                  image: {
                    link: headerImageUrl,
                  },
                },
              ],
            },

            /**
             * BODY
             */
            {
              type: "body",

              parameters: [
                {
                  type: "text",
                  text: String(
                    order.orderNumber
                  ),
                },

                {
                  type: "text",
                  text: String(
                    order.customerName
                  ),
                },

                {
                  type: "text",
                  text: String(
                    order.phone
                  ),
                },

                {
                  type: "text",
                  text: String(
                    order.itemsText
                  ),
                },

                {
                  type: "text",
                  text: String(
                    order.quantity
                  ),
                },

                {
                  type: "text",
                  text: String(
                    order.total
                  ),
                },
              ],
            },
          ],
        },
      }),
    }
  );
}

/**
 * Upload an image to WhatsApp Cloud API
 * and then send it to the recipient.
 *
 * The image is sent using the returned WhatsApp
 * media ID, NOT using image.link.
 */
export async function sendOrderImage(
  file: File
) {
  const phoneNumberId = required(
    "WHATSAPP_PHONE_NUMBER_ID"
  );

  const recipient = required(
    "WHATSAPP_RECIPIENT"
  ).replace(/\D/g, "");

  /**
   * Validate file.
   */
  if (!(file instanceof File)) {
    throw new Error(
      "The uploaded image is not a valid File"
    );
  }

  if (file.size <= 0) {
    throw new Error(
      "The uploaded image is empty"
    );
  }

  if (!file.type.startsWith("image/")) {
    throw new Error(
      `Invalid image type: ${file.type}`
    );
  }

  /**
   * WhatsApp media upload.
   *
   * IMPORTANT:
   * Do NOT manually set Content-Type here.
   * fetch() must generate the multipart/form-data
   * boundary automatically.
   */
  const formData = new FormData();

  formData.append(
    "messaging_product",
    "whatsapp"
  );

  formData.append(
    "type",
    file.type
  );

  formData.append(
    "file",
    file,
    file.name || "souhbadz-image.jpg"
  );

  /**
   * Upload image.
   */
  const media = await graph<{
    id: string;
  }>(
    `/${phoneNumberId}/media`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!media?.id) {
    throw new Error(
      "WhatsApp did not return a media ID"
    );
  }

  console.log(
    "[whatsapp] image uploaded successfully:",
    media.id
  );

  /**
   * Send uploaded image using media ID.
   */
  const result = await graph<{
    messages?: Array<{
      id: string;
    }>;
  }>(
    `/${phoneNumberId}/messages`,
    {
      method: "POST",

      body: JSON.stringify({
        messaging_product: "whatsapp",

        to: recipient,

        type: "image",

        image: {
          id: media.id,

          caption:
            "صورة تصميم البادج المخصص",
        },
      }),
    }
  );

  console.log(
    "[whatsapp] image sent successfully:",
    result
  );

  return result;
}
