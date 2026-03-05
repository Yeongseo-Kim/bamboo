"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAppsInTossMessage = sendAppsInTossMessage;
exports.mtlsFetch = mtlsFetch;
/**
 * 앱인토스 API 클라이언트 (mTLS)
 * https://developers-apps-in-toss.toss.im
 */
const fs = __importStar(require("fs"));
const https = __importStar(require("https"));
const path = __importStar(require("path"));
const HOST = 'apps-in-toss-api.toss.im';
/**
 * mTLS 옵션 생성 (certs 경로는 환경변수 또는 기본값)
 */
function getMtlsOptions() {
    // functions/certs/ 에 인증서 배치 (배포 시 함께 업로드)
    // 또는 APPSINTOSS_MTLS_CERT_PATH, APPSINTOSS_MTLS_KEY_PATH 환경변수 지정
    const certPath = process.env.APPSINTOSS_MTLS_CERT_PATH ||
        path.join(__dirname, '../certs/bamboo-app.crt');
    const keyPath = process.env.APPSINTOSS_MTLS_KEY_PATH ||
        path.join(__dirname, '../certs/bamboo-app.key');
    try {
        const cert = fs.readFileSync(certPath, 'utf8');
        const key = fs.readFileSync(keyPath, 'utf8');
        return { cert, key };
    }
    catch (_a) {
        return null;
    }
}
/**
 * 앱인토스 메시지 발송 API 호출 (mTLS)
 */
async function sendAppsInTossMessage(tossUserKey, params) {
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
        const req = https.request({
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
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                }
                catch (_a) {
                    resolve({
                        resultType: 'FAIL',
                        error: { reason: `Invalid JSON: ${data.slice(0, 200)}` },
                    });
                }
            });
        });
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
async function mtlsFetch(pathname, options = {}) {
    const mtls = getMtlsOptions();
    if (!mtls) {
        throw new Error('mTLS 인증서가 설정되지 않았습니다.');
    }
    const { method = 'GET', body, headers = {} } = options;
    return new Promise((resolve, reject) => {
        const reqHeaders = Object.assign({}, headers);
        if (body) {
            reqHeaders['Content-Type'] = 'application/json';
            reqHeaders['Content-Length'] = String(Buffer.byteLength(body, 'utf8'));
        }
        const req = https.request({
            hostname: HOST,
            port: 443,
            path: pathname,
            method,
            headers: reqHeaders,
            cert: mtls.cert,
            key: mtls.key,
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode || 0, data: parsed });
                }
                catch (_a) {
                    resolve({ status: res.statusCode || 0, data });
                }
            });
        });
        req.on('error', reject);
        if (body)
            req.write(body);
        req.end();
    });
}
//# sourceMappingURL=appsInTossClient.js.map