const DEFAULT_TIMEOUT_MS = 15000;

type SendOtpParams = {
  email: string;
  otp: string;
  expiresInSeconds: number;
};

export const sendPasswordResetOtp = async ({ email, otp, expiresInSeconds }: SendOtpParams) => {
  const url =
    process.env.PASSWORD_RESET_APPS_SCRIPT_URL ||
    process.env.GOOGLE_APPS_SCRIPT_URL;
  const apiKey = process.env.PASSWORD_RESET_API_KEY;

  if (!url) {
    throw new Error('PASSWORD_RESET_APPS_SCRIPT_URL or GOOGLE_APPS_SCRIPT_URL is required');
  }
  if (!apiKey) {
    throw new Error('PASSWORD_RESET_API_KEY is not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        otp,
        expiresInSeconds,
        apiKey,
      }),
      signal: controller.signal,
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error('Apps Script tra ve du lieu khong hop le');
    }

    if (!response.ok || data?.ok !== true) {
      const detail = data?.error || `Apps Script loi status ${response.status}`;
      throw new Error(detail);
    }
  } finally {
    clearTimeout(timeoutId);
  }
};
