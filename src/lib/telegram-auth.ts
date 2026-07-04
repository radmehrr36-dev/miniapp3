import crypto from 'crypto';

// ============================================
// 🤖 وریفای دیتای تلگرام
// ============================================
export function verifyTelegramInitData(initData: string, botToken: string): {
  ok: boolean;
  user?: any;
  error?: string;
} {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) {
      return { ok: false, error: 'Missing hash parameter' };
    }

    urlParams.delete('hash');

    const paramsArray: string[] = [];
    urlParams.forEach((value, key) => {
      paramsArray.push(`${key}=${value}`);
    });
    paramsArray.sort();
    const dataCheckString = paramsArray.join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash !== hash) {
      return { ok: false, error: 'Invalid hash' };
    }

    const userParam = urlParams.get('user');
    if (!userParam) {
      return { ok: false, error: 'User data not found' };
    }

    const user = JSON.parse(decodeURIComponent(userParam));
    return { ok: true, user };

  } catch (error: any) {
    console.error('Verification error:', error);
    return { ok: false, error: error.message || 'Verification failed' };
  }
}

// ============================================
// 📡 دریافت اطلاعات ربات از تلگرام
// ============================================
export async function getBotInfo(botToken: string): Promise<{
  ok: boolean;
  botUsername?: string;
  botName?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json();

    if (!data.ok) {
      return { ok: false, error: data.description || 'Bot API error' };
    }

    return {
      ok: true,
      botUsername: data.result.username,
      botName: data.result.first_name,
    };
  } catch (error: any) {
    return { ok: false, error: error.message || 'Network error' };
  }
}