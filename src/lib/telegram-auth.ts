import crypto from 'crypto';

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