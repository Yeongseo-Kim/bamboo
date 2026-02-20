import * as store from './store';

export async function hasHeart(
  targetType: 'post' | 'comment',
  targetId: string,
  userId: string,
) {
  return store.hasHeart(targetType, targetId, userId);
}

export async function getHeartCount(
  targetType: 'post' | 'comment',
  targetId: string,
) {
  return store.getHeartCount(targetType, targetId);
}

export async function toggleHeart(
  targetType: 'post' | 'comment',
  targetId: string,
  userId: string,
  postOwnerId?: string,
  commentOwnerId?: string,
  postIdForNotif?: string,
) {
  return store.toggleHeart(
    targetType,
    targetId,
    userId,
    postOwnerId,
    commentOwnerId,
    postIdForNotif,
  );
}
