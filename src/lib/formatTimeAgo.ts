import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * createdAt(밀리초 또는 Firestore Timestamp)을 "n분 전" 형식으로 안전하게 변환
 * 잘못된 값이면 빈 문자열 반환 (크래시 방지)
 */
export function formatTimeAgo(createdAt: number | unknown): string {
  let ms: number;
  if (typeof createdAt === 'number' && !Number.isNaN(createdAt)) {
    ms = createdAt;
  } else if (
    createdAt != null &&
    typeof (createdAt as { toMillis?: () => number }).toMillis === 'function'
  ) {
    ms = (createdAt as { toMillis: () => number }).toMillis();
  } else {
    return '방금 전';
  }
  if (ms <= 0 || !Number.isFinite(ms)) return '방금 전';
  try {
    return formatDistanceToNow(ms, {
      addSuffix: true,
      locale: ko,
    });
  } catch {
    return '방금 전';
  }
}
