import * as store from './store';

export async function fetchComments(postId: string) {
  return store.getComments(postId);
}

export async function createComment(
  postId: string,
  userId: string,
  content: string,
) {
  return store.createComment(postId, userId, content);
}

export async function deleteComment(commentId: string, userId: string) {
  return store.deleteComment(commentId, userId);
}
