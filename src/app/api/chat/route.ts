import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message, history, sessionId, modelUsed, openrouterModel, systemPrompt, temperature } = body;

    // تابع کمکی برای ارسال درخواست به OpenRouter
    const callOpenRouter = async (model: string) => {
      return fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
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

    // انتخاب مدل: اگر مدل انتخابی openrouter/free نبود، ابتدا آن را امتحان کن
    let selectedModel = openrouterModel || 'openrouter/free';
    let response = await callOpenRouter(selectedModel);
    let data = await response.json();

    // اگر خطا ۴۰۴ یا ۴۲۹ بود، با openrouter/free دوباره تلاش کن
    if (!response.ok && (response.status === 404 || response.status === 429) && selectedModel !== 'openrouter/free') {
      console.log(`🔄 مدل ${selectedModel} خطا داد (${response.status})، تلاش با openrouter/free...`);
      response = await callOpenRouter('openrouter/free');
      data = await response.json();
    }

    if (!response.ok) {
      console.error('OpenRouter Error:', data);
      return NextResponse.json(
        { error: data.error?.message || 'API error' },
        { status: response.status }
      );
    }

    const reply = data.choices?.[0]?.message?.content || 'پاسخی دریافت نشد.';
    return NextResponse.json({ 
      response: reply,
      reply: reply,
      usedApi: data.provider || (selectedModel !== openrouterModel ? 'OpenRouter (Fallback)' : 'OpenRouter'),
      success: true 
    });

  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { 
        error: error?.message || 'Internal server error',
        response: 'متأسفانه خطایی در سرور رخ داد.',
        success: false 
      },
      { status: 500 }
    );
  }
}