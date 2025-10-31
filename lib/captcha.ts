/**
 * Captcha Verification Utility (Cloudflare Turnstile)
 */

interface TurnstileVerificationResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string; // timestamp of the challenge load (ISO format)
  hostname?: string;
  'cfa-ray'?: string; // unique ID for the challenge
}

export async function verifyTurnstile(token: string | null, ip?: string): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY || process.env.CAPTCHA_ENABLED !== 'true') {
    console.warn('Turnstile is not configured or enabled. Skipping verification.');
    return true; // Allow if not configured
  }

  if (!token) {
    console.warn('Turnstile token is missing.');
    return false;
  }

  try {
    const formData = new FormData();
    formData.append('secret', process.env.TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const data: TurnstileVerificationResponse = await response.json();

    if (data.success) {
      console.log('Turnstile verification successful.');
      return true;
    } else {
      console.warn('Turnstile verification failed:', data['error-codes']);
      return false;
    }
  } catch (error) {
    console.error('Error verifying Turnstile:', error);
    return false;
  }
}






