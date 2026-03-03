/**
 * 기존 posts/comments의 heartCount 필드 백필 스크립트
 *
 * hearts 컬렉션을 세어서 각 문서의 heartCount를 업데이트합니다.
 * 최초 1회만 실행하면 됩니다.
 *
 * 실행:
 *   node scripts/migrate-heart-counts.js
 *
 * 전제 조건:
 *   - .env 파일에 Firebase 설정이 있어야 합니다
 *   - node_modules가 설치되어 있어야 합니다
 */

require('dotenv').config();
const { initializeApp } = require('firebase/app');
const {
    getFirestore,
    collection,
    getDocs,
    query,
    where,
    updateDoc,
    doc,
} = require('firebase/firestore');

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getHeartCountForPost(postId) {
    const [snap1, snap2] = await Promise.all([
        getDocs(query(collection(db, 'hearts'), where('postId', '==', postId))),
        getDocs(query(collection(db, 'hearts'), where('targetType', '==', 'post'), where('targetId', '==', postId))),
    ]);
    const ids = new Set([...snap1.docs.map((d) => d.id), ...snap2.docs.map((d) => d.id)]);
    return ids.size;
}

async function getHeartCountForComment(commentId) {
    const snap = await getDocs(
        query(collection(db, 'hearts'), where('targetType', '==', 'comment'), where('targetId', '==', commentId)),
    );
    return snap.size;
}

async function migrate() {
    console.log('🚀 heartCount 마이그레이션 시작...');

    // Posts 마이그레이션
    console.log('\n📄 Posts 처리 중...');
    const postsSnap = await getDocs(collection(db, 'posts'));
    let postCount = 0;
    for (const postDoc of postsSnap.docs) {
        const heartCount = await getHeartCountForPost(postDoc.id);
        await updateDoc(doc(db, 'posts', postDoc.id), { heartCount });
        postCount++;
        if (postCount % 10 === 0) console.log(`  ${postCount}/${postsSnap.size} 처리됨`);
    }
    console.log(`  ✅ Posts 완료: ${postCount}개`);

    // Comments 마이그레이션
    console.log('\n💬 Comments 처리 중...');
    const commentsSnap = await getDocs(collection(db, 'comments'));
    let commentCount = 0;
    for (const commentDoc of commentsSnap.docs) {
        const heartCount = await getHeartCountForComment(commentDoc.id);
        await updateDoc(doc(db, 'comments', commentDoc.id), { heartCount });
        commentCount++;
        if (commentCount % 10 === 0) console.log(`  ${commentCount}/${commentsSnap.size} 처리됨`);
    }
    console.log(`  ✅ Comments 완료: ${commentCount}개`);

    console.log('\n🎉 마이그레이션 완료!');
    process.exit(0);
}

migrate().catch((err) => {
    console.error('❌ 마이그레이션 실패:', err);
    process.exit(1);
});
