import type { Comment } from '../api/types';

/**
 * 댓글 표시 이름 생성
 * - 글쓴이: 원글 작성자와 동일한 userId
 * - 익명 N: 원글 작성자 외 나머지 댓글 작성자 (순서 기반)
 */
export function getCommentDisplayName(
  comment: Comment,
  postUserId: string,
  allComments: Comment[],
): string {
  if (comment.userId === postUserId) return '글쓴이';
  const others = allComments.filter((c) => c.userId !== postUserId);
  const idx = others.findIndex((c) => c.id === comment.id);
  return idx >= 0 ? `익명 ${idx + 1}` : '익명';
}
