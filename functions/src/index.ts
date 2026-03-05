/**
 * Firebase Cloud Functions - 토스 대나무숲
 * 댓글/공감 시 앱인토스 스마트 발송 푸시 API 호출
 */
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { trySendPush } from './sendPush';

admin.initializeApp();

const db = admin.firestore();

/**
 * 댓글 생성 시 → 게시글 작성자에게 푸시 발송
 */
export const onCommentCreated = functions.firestore
  .document('comments/{commentId}')
  .onCreate(async (snap, ctx) => {
    const comment = snap.data();
    const { postId, userId: commenterId } = comment;

    const postSnap = await db.collection('posts').doc(postId).get();
    if (!postSnap.exists) return;

    const post = postSnap.data()!;
    const postAuthorId = post.userId as string;

    // 본인 댓글 제외
    if (postAuthorId === commenterId) return;

    await trySendPush({
      recipientUserId: postAuthorId,
      postId,
      type: 'comment',
    });

    // 참여자 알림 (해당 글에 댓글 단 다른 사람들)
    const commentsSnap = await db
      .collection('comments')
      .where('postId', '==', postId)
      .get();

    const participantIds = new Set<string>();
    commentsSnap.docs.forEach((d) => {
      const u = d.data().userId as string;
      if (u !== commenterId && u !== postAuthorId) participantIds.add(u);
    });

    for (const participantId of participantIds) {
      await trySendPush({
        recipientUserId: participantId,
        postId,
        type: 'comment',
      });
    }
  });

/**
 * 공감(하트) 생성 시 → 글/댓글 작성자에게 푸시 발송
 */
export const onHeartCreated = functions.firestore
  .document('hearts/{heartId}')
  .onCreate(async (snap, ctx) => {
    const heart = snap.data();
    const { targetType, targetId, userId: likerId } = heart;

    if (!targetType || !targetId) return;

    let ownerId: string;
    let postId: string;

    if (targetType === 'post') {
      const postSnap = await db.collection('posts').doc(targetId).get();
      if (!postSnap.exists) return;
      const post = postSnap.data()!;
      ownerId = post.userId as string;
      postId = targetId;
    } else if (targetType === 'comment') {
      const commentSnap = await db.collection('comments').doc(targetId).get();
      if (!commentSnap.exists) return;
      const comment = commentSnap.data()!;
      ownerId = comment.userId as string;
      postId = comment.postId as string;
    } else {
      return;
    }

    if (ownerId === likerId) return;

    await trySendPush({
      recipientUserId: ownerId,
      postId,
      type: 'heart',
    });
  });

/**
 * 새 글 작성 시 → 전체 등록 사용자에게 푸시 발송
 */
export const onPostCreated = functions.firestore
  .document('posts/{postId}')
  .onCreate(async (snap, ctx) => {
    const post = snap.data();
    const postId = ctx.params.postId;
    const authorId = post.userId as string;

    // tossUserKey가 등록된 전체 사용자 조회
    const userKeysSnap = await db.collection('user_keys').get();

    const pushPromises: Promise<void>[] = [];
    for (const doc of userKeysSnap.docs) {
      const userId = doc.id;
      // 본인 제외
      if (userId === authorId) continue;

      pushPromises.push(
        trySendPush({
          recipientUserId: userId,
          postId,
          type: 'new_post',
        }),
      );
    }

    await Promise.all(pushPromises);
  });

/**
 * 토스 로그인 인가코드로 userKey 등록 (앱에서 호출)
 * - appLogin() → authorizationCode + referrer 전달
 * - 서버에서 토큰 교환 → login-me → userKey 저장
 *
 * 사용 전 필수:
 * 1. 앱인토스 콘솔에서 토스 로그인 연동 완료 (cert.support@toss.im)
 * 2. mTLS 인증서 발급 후 certs/ 폴더에 배치
 */
export const registerUserKeyFromAuthCode = functions.https.onCall(
  async (data: {
    authorizationCode: string;
    referrer: string;
    userId: string;
  }) => {
    const { mtlsFetch } = await import('./appsInTossClient');
    const { authorizationCode, referrer, userId } = data;
    if (!authorizationCode || !userId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'authorizationCode, userId 필수',
      );
    }

    // 1. 토큰 발급 (mTLS)
    const tokenRes = await mtlsFetch(
      '/api-partner/v1/apps-in-toss/user/oauth2/generate-token',
      {
        method: 'POST',
        body: JSON.stringify({
          authorizationCode,
          referrer: referrer || 'DEFAULT',
        }),
      },
    );

    const tokenData = tokenRes.data as {
      resultType?: string;
      success?: { accessToken?: string };
      error?: { reason?: string };
    };

    if (tokenData.resultType !== 'SUCCESS' || !tokenData.success?.accessToken) {
      throw new functions.https.HttpsError(
        'internal',
        tokenData.error?.reason || '토큰 발급 실패',
      );
    }

    const accessToken = tokenData.success.accessToken;

    // 2. 사용자 정보 조회 (userKey)
    const meRes = await mtlsFetch(
      '/api-partner/v1/apps-in-toss/user/oauth2/login-me',
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    const meData = meRes.data as {
      resultType?: string;
      success?: { userKey?: number };
      error?: { reason?: string };
    };

    if (meData.resultType !== 'SUCCESS' || meData.success?.userKey == null) {
      throw new functions.https.HttpsError(
        'internal',
        meData.error?.reason || '사용자 정보 조회 실패',
      );
    }

    const tossUserKey = String(meData.success.userKey);

    // 3. user_keys에 저장
    await db.collection('user_keys').doc(userId).set(
      {
        tossUserKey,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { success: true };
  },
);
