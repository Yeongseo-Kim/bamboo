import { appLogin } from '@apps-in-toss/framework';
import { functions, httpsCallable } from '../lib/firebase';
/**
 * 토스 로그인으로 userKey 등록 (푸시 수신용)
 * Cloud Function registerUserKeyFromAuthCode 호출
 */
import { getUserId } from './client';

/**
 * appLogin 후 서버에 userKey 등록
 * 푸시 ON 시 호출 - 토스 로그인 연동이 되어 있어야 함
 */
export async function registerUserKeyForPush(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { authorizationCode, referrer } = await appLogin();
    const userId = getUserId();

    const register = httpsCallable<
      { authorizationCode: string; referrer: string; userId: string },
      { success: boolean }
    >(functions, 'registerUserKeyFromAuthCode');

    await register({ authorizationCode, referrer, userId });
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
