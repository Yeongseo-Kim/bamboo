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
exports.trySendPush = trySendPush;
/**
 * 푸시 발송 로직 - userKey 확인 후 앱인토스 API 호출
 */
const admin = __importStar(require("firebase-admin"));
const appsInTossClient_1 = require("./appsInTossClient");
const USER_KEYS_COL = 'user_keys';
const NOTIFICATION_PREFS_COL = 'notification_prefs';
const TEMPLATE_COMMENT = 'bamboo-app-comment';
const TEMPLATE_HEART = 'bamboo-app-heart';
const TEMPLATE_NEW_POST = 'bamboo-app-new_post';
const DEEPLINK_BASE = 'intoss://bamboo-app';
/** userId(deviceId)로 tossUserKey 조회 */
async function getTossUserKey(userId) {
    const doc = await admin
        .firestore()
        .collection(USER_KEYS_COL)
        .doc(userId)
        .get();
    const data = doc.data();
    return (data === null || data === void 0 ? void 0 : data.tossUserKey) || null;
}
/** 푸시 수신 동의 여부 */
async function isPushEnabled(userId) {
    const doc = await admin
        .firestore()
        .collection(NOTIFICATION_PREFS_COL)
        .doc(userId)
        .get();
    const data = doc.data();
    return (data === null || data === void 0 ? void 0 : data.pushEnabled) !== false;
}
/**
 * 댓글/공감 알림 시 푸시 발송 시도
 * - userKey가 있고 푸시 동의 시에만 발송
 */
async function trySendPush(payload) {
    var _a;
    const { recipientUserId, postId, type } = payload;
    // 본인 알림 제외 (호출 전에 이미 체크되지만 방어 코드)
    // if (recipientUserId === fromUserId) return;
    const [tossUserKey, pushEnabled] = await Promise.all([
        getTossUserKey(recipientUserId),
        isPushEnabled(recipientUserId),
    ]);
    if (!tossUserKey) {
        // userKey 미등록 - 무시 (Firestore 인앱 알림은 이미 client에서 생성됨)
        return;
    }
    if (!pushEnabled) {
        return;
    }
    const templateSetCode = type === 'comment'
        ? TEMPLATE_COMMENT
        : type === 'heart'
            ? TEMPLATE_HEART
            : TEMPLATE_NEW_POST;
    const landingUrl = `${DEEPLINK_BASE}/post/${postId}`;
    const result = await (0, appsInTossClient_1.sendAppsInTossMessage)(tossUserKey, {
        templateSetCode,
        context: {
            postId,
            landingUrl,
        },
    });
    if (result.resultType !== 'SUCCESS') {
        console.error('[sendPush] AppsInToss API 실패:', (_a = result.error) !== null && _a !== void 0 ? _a : result);
    }
}
//# sourceMappingURL=sendPush.js.map