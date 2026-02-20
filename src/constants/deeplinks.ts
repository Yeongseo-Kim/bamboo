/**
 * 스마트 발송 푸시 클릭 시 미니앱으로 이동하기 위한 딥링크 URL
 * 형식: intoss://bamboo-app/{path}
 */
const APP_SCHEME = 'intoss://bamboo-app';

export const DEEPLINKS = {
  /** 홈 */
  HOME: `${APP_SCHEME}`,
  /** 특정 글 상세 (푸시 클릭 시 가장 많이 사용) */
  postDetail: (postId: string) => `${APP_SCHEME}/post/${postId}`,
  /** 알림 목록 */
  NOTIFICATIONS: `${APP_SCHEME}/notifications`,
} as const;
