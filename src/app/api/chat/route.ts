import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. خواندن کلیدهای API از متغیرهای محیطی
    const API_KEYS = [
      process.env.OPENROUTER_API_KEY_1,
      process.env.OPENROUTER_API_KEY_2,
    ].filter(Boolean) as string[];

    // اگر هیچ کلیدی تنظیم نشده باشد
    if (API_KEYS.length === 0) {
      console.error('❌ هیچ کلید API تنظیم نشده است.');
      return NextResponse.json(
        { 
          error: 'هیچ کلید API تنظیم نشده است.',
          response: 'لطفاً حداقل یک کلید OpenRouter در متغیرهای محیطی تنظیم کنید.'
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message, history, sessionId, modelUsed, openrouterModel, systemPrompt, temperature } = body;

    // تابع کمکی برای ارسال درخواست به OpenRouter با یک کلید خاص
    const callOpenRouter = async (model: string, apiKey: string) => {
      return fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://zippy-brigadeiros-28cfa1.netlify.app',
          'X-Title': 'Rad AI',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt || 'تو یک دستیار هوشمند و دوستانه هستی.' },
            ...(history || []).slice(-6),
            { role: 'user', content: message }
          ],
          temperature: temperature || 0.7,
        }),
      });
    };

    // انتخاب مدل
    let selectedModel = openrouterModel || 'openrouter/free';

    // 2. حلقه برای امتحان کردن کلیدها به ترتیب
    let lastError = null;
    for (let i = 0; i < API_KEYS.length; i++) {
      const apiKey = API_KEYS[i];
      try {
        console.log(`🔄 تلاش با کلید شماره ${i + 1} (OPENROUTER_API_KEY_${i + 1})...`);
        
        let response = await callOpenRouter(selectedModel, apiKey);
        let data = await response.json();

        // اگر خطا ۴۰۴ یا ۴۲۹ بود، با openrouter/free دوباره تلاش کن (با همان کلید)
        if (!response.ok && (response.status === 404 || response.status === 429) && selectedModel !== 'openrouter/free') {
          console.log(`🔄 مدل ${selectedModel} با کلید ${i + 1} خطا داد (${response.status})، تلاش با openrouter/free...`);
          response = await callOpenRouter('openrouter/free', apiKey);
          data = await response.json();
        }

        if (!response.ok) {
          // اگر خطا ۴۲۹ یا ۴۰۴ بود، کلید بعدی را امتحان کن
          if (response.status === 429 || response.status === 404) {
            console.warn(`⚠️ کلید ${i + 1} با خطای ${response.status} مواجه شد. تلاش با کلید بعدی...`);
            continue;
          }
          // خطای دیگر: گزارش کن و ادامه بده
          console.error(`❌ خطای غیرمنتظره از کلید ${i + 1}:`, data);
          continue;
        }

        // موفقیت! پاسخ را برگردان
        const reply = data.choices?.[0]?.message?.content || 'پاسخی دریافت نشد.';
        console.log(`✅ پاسخ موفق با کلید شماره ${i + 1} (مدل: ${data.model || selectedModel})`);
        
        return NextResponse.json({ 
          response: reply,
          reply: reply,
          usedApi: `Key ${i + 1} - ${data.provider || 'OpenRouter'}`,
          success: true 
        });

      } catch (error: any) {
        console.error(`❌ خطا در کلید ${i + 1}:`, error.message);
        lastError = error;
        continue;
      }
    }

    // اگر همه کلیدها خطا دادند
    console.error('❌ تمام کلیدهای API ناموفق بودند.');
    return NextResponse.json(
      { 
        error: 'همه کلیدهای API در دسترس نیستند.',
        response: 'متأسفانه سرویس در حال حاضر در دسترس نیست.'
      },
      { status: 503 }
    );

  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { 
        error: error?.message || 'Internal server error',
        response: 'خطایی در سرور رخ داد.'
      },
      { status: 500 }
    );
  }
}