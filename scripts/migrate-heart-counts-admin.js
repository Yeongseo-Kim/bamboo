/**
 * firebase-admin을 사용한 heartCount 마이그레이션 스크립트
 *
 * 실행:
 *   node scripts/migrate-heart-counts-admin.js
 *
 * 전제: firebase-admin이 설치되어 있어야 하며,
 * Application Default Credentials (ADC)가 설정되어 있어야 합니다.
 * (firebase CLI로 로그인되어 있으면 자동으로 사용됩니다)
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault() });

const db = getFirestore();
db.settings({ projectId: 'bamboo-ff951' });

async function getPostHeartCount(postId) {
    const [snap1, snap2] = await Promise.all([
        db.collection('hearts').where('postId', '==', postId).get(),
        db.collection('hearts').where('targetType', '==', 'post').where('targetId', '==', postId).get(),
    ]);
    const ids = new Set([...snap1.docs.map((d) => d.id), ...snap2.docs.map((d) => d.id)]);
    return ids.size;
}

async function getCommentHeartCount(commentId) {
    const snap = await db.collection('hearts')
        .where('targetType', '==', 'comment')
        .where('targetId', '==', commentId)
        .get();
    return snap.size;
}

async function migrate() {
    console.log('🚀 heartCount 마이그레이션 시작...');

    // Posts
    console.log('\n📄 Posts 처리 중...');
    const postsSnap = await db.collection('posts').get();
    const postBatch = db.batch();
    let i = 0;
    for (const postDoc of postsSnap.docs) {
        const heartCount = await getPostHeartCount(postDoc.id);
        postBatch.update(postDoc.ref, { heartCount });
        i++;
        if (i % 10 === 0 || i === postsSnap.size) console.log(`  ${i}/${postsSnap.size} 처리됨`);
    }
    await postBatch.commit();
    console.log(`  ✅ Posts 완료: ${postsSnap.size}개`);

    // Comments
    console.log('\n💬 Comments 처리 중...');
    const commentsSnap = await db.collection('comments').get();
    const commentBatch = db.batch();
    let j = 0;
    for (const commentDoc of commentsSnap.docs) {
        const heartCount = await getCommentHeartCount(commentDoc.id);
        commentBatch.update(commentDoc.ref, { heartCount });
        j++;
        if (j % 10 === 0 || j === commentsSnap.size) console.log(`  ${j}/${commentsSnap.size} 처리됨`);
    }
    await commentBatch.commit();
    console.log(`  ✅ Comments 완료: ${commentsSnap.size}개`);

    console.log('\n🎉 마이그레이션 완료!');
    process.exit(0);
}

migrate().catch((err) => {
    console.error('❌ 마이그레이션 실패:', err);
    process.exit(1);
});
