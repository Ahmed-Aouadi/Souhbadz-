# SouhbaDz — WhatsApp Cloud API

نسخة جديدة من متجر SouhbaDz مبنية على Next.js. تأكيد الطلب لا يفتح WhatsApp عند العميل؛ الطلب يمر إلى الخادم ثم إلى WhatsApp Cloud API.

## Environment Variables

ضع القيم في Vercel > Settings > Environment Variables، ولا تضع Access Token داخل React أو HTML.

- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_RECIPIENT`
- `WHATSAPP_TEMPLATE_NAME` (افتراضيًا `new_order2`)
- `WHATSAPP_LANGUAGE` (افتراضيًا `ar`)
- `WHATSAPP_VERSION` (افتراضيًا `v23.0`)
- `BLOB_READ_WRITE_TOKEN`

## قالب WhatsApp

النسخة الجديدة ترسل قالب WhatsApp بستة متغيرات في جسم الرسالة:

1. رقم الطلب
2. اسم العميل
3. رقم الهاتف
4. المنتجات + الولاية + الملاحظات
5. الكمية الإجمالية
6. الإجمالي

يجب أن يكون القالب الموجود في Meta مطابقًا لعدد وترتيب المتغيرات واللغة.

## الصور المخصصة

صور البادج المخصص تبقى في ذاكرة المتصفح إلى أن يضغط العميل على تأكيد الطلب. عند التأكيد تُرسل كملفات إلى الخادم، ثم يحاول الخادم إرسالها عبر WhatsApp Cloud API مباشرة.

قد ترفض Meta رسالة الصورة في بعض حالات نافذة المراسلة/القوالب؛ في هذه الحالة يصل نص الطلب ويظهر للعميل أن الصورة تحتاج إرسالًا يدويًا.

## السعر

السعر يُعاد حسابه على الخادم. عند الوصول إلى حد الجملة (افتراضيًا 20) يصبح السعر 70 دج للحبة.

## النشر

استخدم Node.js 24.x كما هو محدد في `package.json`، ثم:

```bash
pnpm install
pnpm build
pnpm start
```
