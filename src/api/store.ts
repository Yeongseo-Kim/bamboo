/**
 * Firestore 기반 데이터 스토어
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import { containsBlockedContent } from '../lib/cleanBot';
import { db } from '../lib/firebase';
import { generateNickname } from '../lib/nickname';
import type { Comment, Post } from './types';

const POSTS_COL = 'posts';
const COMMENTS_COL = 'comments';
const HEARTS_COL = 'hearts';
const REPORTS_COL = 'reports';
const NOTIFICATIONS_COL = 'notifications';
const NOTIFICATION_PREFS_COL = 'notification_prefs';

/** Firestore Timestamp 또는 number를 밀리초로 변환 */
function toMillis(value: unknown): number {
  if (typeof value === 'number') return value;
  const withToMillis = value as { toMillis?: () => number } | undefined;
  return withToMillis?.toMillis?.() ?? 0;
}

function toPost(
  id: string,
  data: Record<string, unknown>,
  heartCount: number,
): Post {
  return {
    id,
    userId: data.userId as string,
    content: data.content as string,
    nickname: data.nickname as string,
    createdAt: toMillis(data.createdAt),
    heartCount,
    reportCount: (data.reportCount as number) ?? 0,
    isHidden: (data.isHidden as boolean) ?? false,
  };
}

function toComment(
  id: string,
  data: Record<string, unknown>,
  heartCount: number,
): Comment {
  return {
    id,
    postId: data.postId as string,
    userId: data.userId as string,
    content: data.content as string,
    createdAt: toMillis(data.createdAt),
    reportCount: (data.reportCount as number) ?? 0,
    isHidden: (data.isHidden as boolean) ?? false,
    heartCount,
  };
}

async function getHeartCountForTarget(
  targetType: 'post' | 'comment',
  targetId: string,
): Promise<number> {
  const q = query(
    collection(db, HEARTS_COL),
    where('targetType', '==', targetType),
    where('targetId', '==', targetId),
  );
  const snap = await getDocs(q);
  // 하위 호환성: targetType 필드가 없는 경우 postId 필드로 조회된 결과도 포함될 수 있음 (기존 데이터)
  // 하지만 여기서는 targetType, targetId가 명확히 저장된 신규 구조를 따름.
  // 기존 데이터 마이그레이션이 없다면 post의 경우 postId로 조회하는 로직이 필요할 수 있음.
  // 일단 기존 함수 getHeartCountForPost를 유지하고, 이 함수는 신규 로직용으로 사용.
  return snap.size;
}

async function getHeartCountForPost(postId: string): Promise<number> {
  // 기존 데이터 (postId 필드만 있음) + 신규 데이터 (targetType='post', targetId=postId)
  // 사실상 기존 데이터와 신규 데이터가 섞여있을 수 있음.
  // 기존 로직 유지: postId 필드가 있는 문서를 찾음.
  // 신규 로직: targetId가 postId이고 targetType이 'post'인 문서를 찾음.
  // 편의상 기존 posts에 대한 하트는 postId 필드를 계속 사용하는게 나을 수 있으나,
  // 통일성을 위해 targetId로 전환하는게 좋음.
  // * 마이그레이션 없이 양쪽 다 지원하려면 복잡해짐.
  // * 여기서는 'post'에 대해서는 기존 로직(postId 필드 사용)을 유지하고,
  // * 'comment'에 대해서는 신규 로직(targetType, targetId)을 사용하는 방식으로 분기 처리가 안전함.

  // 1. 기존 방식 (postId 필드로 쿼리)
  const q1 = query(collection(db, HEARTS_COL), where('postId', '==', postId));
  const snap1 = await getDocs(q1);

  // 2. 신규 방식 (targetType='post', targetId=postId)
  const q2 = query(
    collection(db, HEARTS_COL),
    where('targetType', '==', 'post'),
    where('targetId', '==', postId),
  );
  const snap2 = await getDocs(q2);

  // 중복 제거 (ID 기준)
  const ids = new Set([...snap1.docs.map((d) => d.id), ...snap2.docs.map((d) => d.id)]);
  return ids.size;
}

export async function getPosts(
  limitCount: number,
  lastId?: string,
): Promise<Post[]> {
  const postsRef = collection(db, POSTS_COL);
  let q = query(
    postsRef,
    where('isHidden', '==', false),
    orderBy('createdAt', 'desc'),
    limit(limitCount),
  );

  if (lastId) {
    const lastDoc = await getDoc(doc(db, POSTS_COL, lastId));
    if (lastDoc.exists()) {
      q = query(
        postsRef,
        where('isHidden', '==', false),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(limitCount),
      );
    }
  }

  const snap = await getDocs(q);
  const results: Post[] = [];

  for (const document of snap.docs) {
    const d = document.data();
    if (d.isHidden) continue;
    const heartCount = await getHeartCountForPost(document.id);
    results.push(toPost(document.id, d, heartCount));
  }

  return results;
}

export async function getPost(id: string): Promise<Post | null> {
  const docRef = doc(db, POSTS_COL, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const d = snap.data();
  if (d.isHidden) return null;
  const heartCount = await getHeartCountForPost(id);
  return toPost(id, d, heartCount);
}

export async function createPost(
  userId: string,
  content: string,
): Promise<Post | null> {
  if (containsBlockedContent(content)) return null;

  const nickname = generateNickname();
  const postsRef = collection(db, POSTS_COL);
  const docRef = await addDoc(postsRef, {
    userId,
    content: content.trim(),
    nickname,
    createdAt: Date.now(),
    reportCount: 0,
    isHidden: false,
  });

  return {
    id: docRef.id,
    userId,
    content: content.trim(),
    nickname,
    createdAt: Date.now(),
    heartCount: 0,
    reportCount: 0,
    isHidden: false,
  };
}

export async function deletePost(
  postId: string,
  userId: string,
): Promise<boolean> {
  const postRef = doc(db, POSTS_COL, postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) return false;
  const post = snap.data();
  if (post.userId !== userId) return false;

  await deleteDoc(postRef);

  const commentsSnap = await getDocs(
    query(collection(db, COMMENTS_COL), where('postId', '==', postId)),
  );
  const commentIds = commentsSnap.docs.map((d) => d.id);
  for (const c of commentsSnap.docs) {
    await deleteDoc(doc(db, COMMENTS_COL, c.id));
  }

  // 게시글 좋아요 삭제 (postId 또는 targetType='post')
  const postHeartsSnap = await getDocs(
    query(collection(db, HEARTS_COL), where('postId', '==', postId)),
  );
  for (const h of postHeartsSnap.docs) {
    await deleteDoc(doc(db, HEARTS_COL, h.id));
  }

  // 댓글 좋아요 삭제 (targetType='comment', targetId=commentId)
  for (const commentId of commentIds) {
    const commentHeartsSnap = await getDocs(
      query(
        collection(db, HEARTS_COL),
        where('targetType', '==', 'comment'),
        where('targetId', '==', commentId),
      ),
    );
    for (const h of commentHeartsSnap.docs) {
      await deleteDoc(doc(db, HEARTS_COL, h.id));
    }
  }

  const reportsSnap = await getDocs(
    query(
      collection(db, REPORTS_COL),
      where('targetType', '==', 'post'),
      where('targetId', '==', postId),
    ),
  );
  for (const r of reportsSnap.docs) {
    await deleteDoc(doc(db, REPORTS_COL, r.id));
  }

  return true;
}

export async function getComments(postId: string): Promise<Comment[]> {
  const q = query(
    collection(db, COMMENTS_COL),
    where('postId', '==', postId),
    where('isHidden', '==', false),
    orderBy('createdAt', 'asc'),
  );
  const snap = await getDocs(q);
  const results: Comment[] = [];

  for (const document of snap.docs) {
    const d = document.data();
    const heartCount = await getHeartCountForTarget('comment', document.id);
    results.push(toComment(document.id, d, heartCount));
  }
  return results;
}

export async function createComment(
  postId: string,
  userId: string,
  content: string,
): Promise<Comment | null> {
  if (containsBlockedContent(content)) return null;

  const commentsRef = collection(db, COMMENTS_COL);
  const docRef = await addDoc(commentsRef, {
    postId,
    userId,
    content: content.trim(),
    createdAt: Date.now(),
    reportCount: 0,
    isHidden: false,
  });

  // 알림 생성 로직
  // 1. 게시글 작성자에게 알림
  const postSnap = await getDoc(doc(db, POSTS_COL, postId));
  if (postSnap.exists()) {
    const postData = postSnap.data();
    if (postData.userId !== userId) {
      await createNotification({
        userId: postData.userId,
        type: 'comment_on_post',
        targetId: postId, // 게시글 ID로 이동
        postId: postId,
        fromUserId: userId,
        message: '누군가 내 글에 댓글을 남겼어요.',
      });
    }
  }

  // 2. 해당 게시글에 댓글을 단 다른 사용자들에게 알림 (참여자 알림)
  // 중복 발송 방지를 위해 Set 사용
  const commentsSnap = await getDocs(
    query(collection(db, COMMENTS_COL), where('postId', '==', postId)),
  );
  const participantIds = new Set<string>();
  commentsSnap.docs.forEach((d) => {
    const dData = d.data();
    if (dData.userId !== userId && dData.userId !== postSnap.data()?.userId) {
      participantIds.add(dData.userId as string);
    }
  });

  for (const participantId of participantIds) {
    await createNotification({
      userId: participantId,
      type: 'comment_on_participated',
      targetId: postId,
      postId: postId,
      fromUserId: userId,
      message: '참여한 글에 새로운 댓글이 달렸어요.',
    });
  }

  const snap = await getDoc(docRef);
  return toComment(docRef.id, snap.data() ?? {}, 0);
}

export async function deleteComment(
  commentId: string,
  userId: string,
): Promise<boolean> {
  const commentRef = doc(db, COMMENTS_COL, commentId);
  const snap = await getDoc(commentRef);
  if (!snap.exists()) return false;
  const comment = snap.data();
  if (comment.userId !== userId) return false;

  await deleteDoc(commentRef);

  const reportsSnap = await getDocs(
    query(
      collection(db, REPORTS_COL),
      where('targetType', '==', 'comment'),
      where('targetId', '==', commentId),
    ),
  );
  for (const r of reportsSnap.docs) {
    await deleteDoc(doc(db, REPORTS_COL, r.id));
  }

  return true;
}

export async function hasHeart(
  targetType: 'post' | 'comment',
  targetId: string,
  userId: string,
): Promise<boolean> {
  // post의 경우 기존 postId 필드 사용 데이터를 고려하여 두 가지 방식 모두 체크하거나,
  // createHeart 시점에 통일하는 것이 좋음.
  // 여기서는 쿼리로 확인.
  if (targetType === 'post') {
    const heartIdLegacy = `${targetId}_${userId}`;
    const snapLegacy = await getDoc(doc(db, HEARTS_COL, heartIdLegacy));
    if (snapLegacy.exists()) return true;
  }

  const heartId = `${targetType}_${targetId}_${userId}`;
  const heartRef = doc(db, HEARTS_COL, heartId);
  const snap = await getDoc(heartRef);
  return snap.exists();
}

export async function getHeartCount(
  targetType: 'post' | 'comment',
  targetId: string,
): Promise<number> {
  if (targetType === 'post') {
    return getHeartCountForPost(targetId);
  }
  return getHeartCountForTarget(targetType, targetId);
}

export async function toggleHeart(
  targetType: 'post' | 'comment',
  targetId: string,
  userId: string,
  postOwnerId?: string, // 게시글 작성자 ID (알림용, post 좋아요인 경우)
  commentOwnerId?: string, // 댓글 작성자 ID (알림용, comment 좋아요인 경우)
  postIdForNotif?: string, // 알림 클릭시 이동할 포스트 ID
): Promise<boolean> {
  // 식별자 생성 규칙:
  // post: 기존엔 `${postId}_${userId}` 였음.
  // comment: 신규 `${targetType}_${targetId}_${userId}`
  // 통일성을 위해 post도 신규 규칙을 따르되, 기존 데이터와의 호환성을 위해 Legacy ID도 체크/삭제 해야 함.

  let heartId = `${targetType}_${targetId}_${userId}`;

  // Post인 경우 기존 ID 우선 체크
  if (targetType === 'post') {
    const heartIdLegacy = `${targetId}_${userId}`;
    const heartRefLegacy = doc(db, HEARTS_COL, heartIdLegacy);
    const snapLegacy = await getDoc(heartRefLegacy);
    if (snapLegacy.exists()) {
      await deleteDoc(heartRefLegacy);
      return false;
    }
    // Legacy가 없으면 신규 ID 사용 (아래 로직)
  }

  const heartRef = doc(db, HEARTS_COL, heartId);
  const snap = await getDoc(heartRef);

  if (snap.exists()) {
    await deleteDoc(heartRef);
    return false;
  }

  await setDoc(heartRef, {
    targetType,
    targetId,
    userId,
    // 하위 호환성을 위해 post인 경우 postId 필드도 추가해줌 (선택사항이나 안전을 위해)
    ...(targetType === 'post' ? { postId: targetId } : {}),
  });

  // 알림 생성
  if (targetType === 'post' && postOwnerId && postOwnerId !== userId) {
    await createNotification({
      userId: postOwnerId,
      type: 'like_post',
      targetId: targetId,
      postId: targetId,
      fromUserId: userId,
      message: '누군가 내 글을 좋아해요.',
    });
  } else if (
    targetType === 'comment' &&
    commentOwnerId &&
    commentOwnerId !== userId &&
    postIdForNotif
  ) {
    await createNotification({
      userId: commentOwnerId,
      type: 'like_comment',
      targetId: targetId,
      postId: postIdForNotif,
      fromUserId: userId,
      message: '누군가 내 댓글을 좋아해요.',
    });
  }

  return true;
}

// Notification API
import type { Notification } from './types';

export async function getNotifications(userId: string): Promise<Notification[]> {
  const q = query(
    collection(db, NOTIFICATIONS_COL),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      type: data.type,
      targetId: data.targetId,
      postId: data.postId,
      fromUserId: data.fromUserId,
      message: data.message,
      isRead: data.isRead,
      createdAt: data.createdAt,
    };
  });
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const ref = doc(db, NOTIFICATIONS_COL, notificationId);
  await updateDoc(ref, { isRead: true });
}

/** 스마트 발송 푸시 수신 동의 여부 (토스 필수: 해제 경로 제공) */
export async function getNotificationPrefs(
  userId: string,
): Promise<{ pushEnabled: boolean }> {
  const ref = doc(db, NOTIFICATION_PREFS_COL, userId);
  const snap = await getDoc(ref);
  const data = snap.data();
  return {
    pushEnabled: data?.pushEnabled !== false, // 기본값 true (동의)
  };
}

export async function setNotificationPrefs(
  userId: string,
  pushEnabled: boolean,
): Promise<void> {
  const ref = doc(db, NOTIFICATION_PREFS_COL, userId);
  await setDoc(ref, { pushEnabled, updatedAt: Date.now() }, { merge: true });
}

export async function createNotification(params: {
  userId: string;
  type: Notification['type'];
  targetId: string;
  postId: string;
  fromUserId: string;
  message: string;
}): Promise<void> {
  if (params.userId === params.fromUserId) return; // 본인에게 알림 X

  // 동일한 타입/타겟/발신자의 읽지 않은 알림이 이미 있으면 중복 생성 방지 또는 갱신
  // 여기서는 단순화를 위해 매번 생성하되, 클라이언트에서 묶어 보여주거나 하지 않음.
  // 스팸 방지를 위해 최근 동일 알림 체크 로직을 넣을 수도 있지만, MVP에서는 생략.

  await addDoc(collection(db, NOTIFICATIONS_COL), {
    ...params,
    isRead: false,
    createdAt: Date.now(),
  });
}

export async function createReport(
  targetType: 'post' | 'comment',
  targetId: string,
  userId: string,
): Promise<void> {
  const reportsRef = collection(db, REPORTS_COL);
  const existingSnap = await getDocs(
    query(
      reportsRef,
      where('targetType', '==', targetType),
      where('targetId', '==', targetId),
      where('userId', '==', userId),
    ),
  );
  if (!existingSnap.empty) return;

  await addDoc(reportsRef, {
    targetType,
    targetId,
    userId,
    createdAt: Date.now(),
  });

  const countSnap = await getDocs(
    query(
      reportsRef,
      where('targetType', '==', targetType),
      where('targetId', '==', targetId),
    ),
  );
  const count = countSnap.size;

  if (targetType === 'post') {
    const postRef = doc(db, POSTS_COL, targetId);
    await updateDoc(postRef, {
      reportCount: count,
      isHidden: count >= 5,
    });
  } else {
    const commentRef = doc(db, COMMENTS_COL, targetId);
    await updateDoc(commentRef, {
      reportCount: count,
      isHidden: count >= 5,
    });
  }
}
