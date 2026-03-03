/**
 * 푸시 발송 로직 - userKey 확인 후 앱인토스 API 호출
 */
import * as admin from 'firebase-admin';
import { sendAppsInTossMessage } from './appsInTossClient';

const USER_KEYS_COL = 'user_keys';
const NOTIFICATION_PREFS_COL = 'notification_prefs';
const TEMPLATE_COMMENT = 'bamboo-app-bamboo_comment_notification';
const TEMPLATE_HEART = 'bamboo-app-bamboo_heart_notification';
const DEEPLINK_BASE = 'intoss://bamboo-app';

/** userId(deviceId)로 tossUserKey 조회 */
async function getTossUserKey(userId: string): Promise<string | null> {
  const doc = await admin
    .firestore()
    .collection(USER_KEYS_COL)
    .doc(userId)
    .get();
  const data = doc.data();
  return (data?.tossUserKey as string) || null;
}

/** 푸시 수신 동의 여부 */
async function isPushEnabled(userId: string): Promise<boolean> {
  const doc = await admin
    .firestore()
    .collection(NOTIFICATION_PREFS_COL)
    .doc(userId)
    .get();
  const data = doc.data();
  return data?.pushEnabled !== false;
}

export interface PushPayload {
  recipientUserId: string;
  postId: string;
  type: 'comment' | 'heart';
}

/**
 * 댓글/공감 알림 시 푸시 발송 시도
 * - userKey가 있고 푸시 동의 시에만 발송
 */
export async function trySendPush(payload: PushPayload): Promise<void> {
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

  const templateSetCode =
    type === 'comment' ? TEMPLATE_COMMENT : TEMPLATE_HEART;
  const landingUrl = `${DEEPLINK_BASE}/post/${postId}`;

  const result = await sendAppsInTossMessage(tossUserKey, {
    templateSetCode,
    context: {
      postId,
      landingUrl,
    },
  });

  if (result.resultType !== 'SUCCESS') {
    console.error('[sendPush] AppsInToss API 실패:', result.error ?? result);
  }
}
