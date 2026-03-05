/**
 * 기존 게시글의 commentCount를 실제 댓글 수로 업데이트하는 마이그레이션 스크립트
 *
 * 실행:
 *   node scripts/migrate-comment-counts.js
 *
 * 전제: firebase-admin이 설치되어 있어야 하며,
 * Application Default Credentials (ADC)가 설정되어 있어야 합니다.
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault() });

const db = getFirestore();
db.settings({ projectId: 'bamboo-ff951' });

async function migrate() {
    console.log('🚀 commentCount 마이그레이션 시작...');

    const postsSnap = await db.collection('posts').get();
    console.log(`📄 총 ${postsSnap.size}개 게시글 처리 중...`);

    const batch = db.batch();
    let updated = 0;

    for (const postDoc of postsSnap.docs) {
        const commentsSnap = await db.collection('comments')
            .where('postId', '==', postDoc.id)
            .get();

        const commentCount = commentsSnap.size;
        const current = postDoc.data().commentCount ?? 0;

        if (current !== commentCount) {
            batch.update(postDoc.ref, { commentCount });
            updated++;
            console.log(`  ${postDoc.id}: ${current} → ${commentCount}`);
        }
    }

    if (updated > 0) {
        await batch.commit();
        console.log(`\n✅ ${updated}개 게시글 commentCount 업데이트 완료!`);
    } else {
        console.log('\n✅ 모든 게시글의 commentCount가 이미 정확합니다.');
    }

    process.exit(0);
}

migrate().catch((err) => {
    console.error('❌ 마이그레이션 실패:', err);
    process.exit(1);
});
