# مكتبتي الصوتية — MP3 Private Uploader

لوحة بسيطة خاصة بك لرفع ملفات الصوت إلى Supabase والحصول على روابط عامة مباشرة لاستخدامها داخل تطبيقاتك.

## قبل النشر
1. أنشئي مشروعًا في https://supabase.com
2. من Authentication > Users أنشئي مستخدمًا واحدًا لكِ (Create new user). لا تفعّلي التسجيل العام.
3. من Project Settings > API انسخي Project URL و anon/public key.
4. افتحي `app.js` وضعي القيم مكان:
   - `https://YOUR-PROJECT.supabase.co`
   - `YOUR_SUPABASE_ANON_KEY`
5. افتحي SQL Editor في Supabase، والصقي محتوى `supabase-setup.sql` ثم Run.
6. ارفعي الملفات إلى مستودع GitHub جديد.
7. من Settings > Pages اختاري Deploy from a branch ثم `main` و`/(root)` واحفظي.

## الاستخدام
- افتحي رابط GitHub Pages وسجّلي الدخول بالبريد وكلمة المرور اللذين أنشأتِهما.
- ارفعي MP3 أو WAV أو M4A (حتى 25MB افتراضيًا).
- انسخي الرابط المباشر واستخدميه في تطبيقك.

## ملاحظات مهمة
- لوحة الإدارة تتطلب تسجيل الدخول. لا تضعي `service_role` key في الموقع أبدًا؛ استخدمي anon/public key فقط.
- الملفات عامة لمن يمتلك الرابط، حتى يستطيع تطبيقك تشغيلها دون تسجيل دخول. لا ترفعي تسجيلات حساسة أو خاصة جدًا.
- حد 25MB قابل للتعديل في `app.js` وSQL، لكن يجب أن يتوافق مع حدود خطتك في Supabase.
- إذا كان تطبيقك يتطلب رابطًا لا ينتهي، استخدمي Public bucket كما في الإعداد. يمكن لأي شخص لديه الرابط تشغيل/تنزيل الملف.
- GitHub Pages ينشر الموقع فقط؛ ملفات الصوت محفوظة في Supabase.
