/**
 * 라우팅 경로 상수 (Granite 파일 기반 라우팅)
 * navigate 시 타입 안전성 및 유지보수성을 위해 사용
 */
export const ROUTES = {
  HOME: '/',
  WRITE: '/write',
  POST_DETAIL: '/post/:id',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
} as const;

export function postDetailPath(id: string): { id: string } {
  return { id };
}
