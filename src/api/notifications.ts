import * as store from './store';

export async function fetchNotifications(userId: string) {
  return store.getNotifications(userId);
}

export async function markNotificationRead(notificationId: string) {
  return store.markNotificationRead(notificationId);
}

/** 스마트 발송 푸시 수신 설정 (토스 필수: 알림 해제 경로) */
export async function getNotificationPrefs(userId: string) {
  return store.getNotificationPrefs(userId);
}

export async function setNotificationPrefs(
  userId: string,
  pushEnabled: boolean,
) {
  return store.setNotificationPrefs(userId, pushEnabled);
}
