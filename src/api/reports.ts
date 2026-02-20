import * as store from './store';

export async function reportPost(postId: string, userId: string) {
  return store.createReport('post', postId, userId);
}

export async function reportComment(commentId: string, userId: string) {
  return store.createReport('comment', commentId, userId);
}
