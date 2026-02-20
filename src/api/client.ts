import { getDeviceId } from '@apps-in-toss/framework';

/**
 * 현재 사용자 ID (getDeviceId 기반)
 */
export function getUserId(): string {
  return getDeviceId();
}
