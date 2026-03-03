/**
 * 앱인토스 API 클라이언트 (mTLS)
 * https://developers-apps-in-toss.toss.im
 */
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

const HOST = 'apps-in-toss-api.toss.im';

export interface SendMessageParams {
  templateSetCode: string;
  context: Record<string, string>;
}

export interface SendMessageResult {
  resultType: string;
  result?: {
    msgCount: number;
    sentPushCount: number;
    sentInboxCount: number;
    detail?: { fail?: unknown };
  };
  error?: { errorCode?: string; reason?: string };
}

/**
 * mTLS 옵션 생성 (certs 경로는 환경변수 또는 기본값)
 */
function getMtlsOptions(): { cert: string; key: string } | null {
  // functions/certs/ 에 인증서 배치 (배포 시 함께 업로드)
  // 또는 APPSINTOSS_MTLS_CERT_PATH, APPSINTOSS_MTLS_KEY_PATH 환경변수 지정
  const certPath =
    process.env.APPSINTOSS_MTLS_CERT_PATH ||
    path.join(__dirname, '../certs/bamboo-app.crt');
  const keyPath =
    process.env.APPSINTOSS_MTLS_KEY_PATH ||
    path.join(__dirname, '../certs/bamboo-app.key');

  try {
    const cert = fs.readFileSync(certPath, 'utf8');
    const key = fs.readFileSync(keyPath, 'utf8');
    return { cert, key };
  } catch {
    return null;
  }
}

/**
 * 앱인토스 메시지 발송 API 호출 (mTLS)
 */
export async function sendAppsInTossMessage(
  tossUserKey: string,
  params: SendMessageParams,
): Promise<SendMessageResult> {
  const mtls = getMtlsOptions();
  if (!mtls) {
    return {
      resultType: 'FAIL',
      error: {
        errorCode: 'MTLS_NOT_CONFIGURED',
        reason: 'mTLS 인증서가 설정되지 않았습니다. certs/ 폴더를 확인하세요.',
      },
    };
  }

  const body = JSON.stringify({
    templateSetCode: params.templateSetCode,
    context: params.context,
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: HOST,
        port: 443,
        path: '/api-partner/v1/apps-in-toss/messenger/send-message',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Toss-User-Key': String(tossUserKey),
          'Content-Length': Buffer.byteLength(body, 'utf8'),
        },
        cert: mtls.cert,
        key: mtls.key,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data) as SendMessageResult;
            resolve(json);
          } catch {
            resolve({
              resultType: 'FAIL',
              error: { reason: `Invalid JSON: ${data.slice(0, 200)}` },
            });
          }
        });
      },
    );

    req.on('error', (err) => {
      resolve({
        resultType: 'FAIL',
        error: { reason: err.message || 'Network error' },
      });
    });

    req.write(body);
    req.end();
  });
}

/**
 * mTLS로 앱인토스 API 호출 (POST/GET)
 */
export async function mtlsFetch(
  pathname: string,
  options: {
    method?: 'GET' | 'POST';
    body?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<{ status: number; data: unknown }> {
  const mtls = getMtlsOptions();
  if (!mtls) {
    throw new Error('mTLS 인증서가 설정되지 않았습니다.');
  }

  const { method = 'GET', body, headers = {} } = options;

  return new Promise((resolve, reject) => {
    const reqHeaders: Record<string, string> = {
      ...headers,
    };
    if (body) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = String(Buffer.byteLength(body, 'utf8'));
    }

    const req = https.request(
      {
        hostname: HOST,
        port: 443,
        path: pathname,
        method,
        headers: reqHeaders,
        cert: mtls.cert,
        key: mtls.key,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode || 0, data: parsed });
          } catch {
            resolve({ status: res.statusCode || 0, data });
          }
        });
      },
    );

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}
