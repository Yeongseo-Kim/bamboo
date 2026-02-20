import { createRoute } from '@granite-js/react-native';
import {
  Button,
  List,
  PageNavbar,
  TextArea,
  TextButton,
  Toast,
  Txt,
} from '@toss/tds-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { getUserId } from '../../api/client';
import {
  createComment,
  deleteComment,
  fetchComments,
} from '../../api/comments';
import {
  hasHeart as checkHasHeart,
  getHeartCount,
  toggleHeart,
} from '../../api/hearts';
import { deletePost, fetchPost } from '../../api/posts';
import { reportComment, reportPost } from '../../api/reports';
import type { Comment, Post } from '../../api/types';
import { CommentItem } from '../../components/CommentItem';
import { HeartButton } from '../../components/HeartButton';
import { MAX_CONTENT_LENGTH } from '../../constants';
import { useToast } from '../../hooks/useToast';
import { getCommentDisplayName } from '../../lib/commentDisplayName';
import { theme } from '../../theme';

export const Route = createRoute('/post/:id', {
  component: Page,
  validateParams: (params: Readonly<object | undefined>): { id: string } => {
    const p = params as { id?: string } | undefined;
    const id = p?.id;
    if (typeof id !== 'string' || !id) throw new Error('Invalid post id');
    return { id };
  },
});

function Page() {
  const { id } = Route.useParams();
  const navigation = Route.useNavigation();
  const userId = getUserId();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [hearted, setHearted] = useState(false);
  const [heartCount, setHeartCount] = useState(0);
  const [commentHeartMap, setCommentHeartMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast, showToast, closeToast } = useToast();

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [postData, commentList, heart, count] = await Promise.all([
        fetchPost(id),
        fetchComments(id),
        checkHasHeart('post', id, userId),
        getHeartCount('post', id),
      ]);
      setPost(postData ?? null);
      setComments(commentList);
      setHearted(heart);
      setHeartCount(count);

      // Fetch comment hearts
      const map: Record<string, boolean> = {};
      for (const c of commentList) {
        map[c.id] = await checkHasHeart('comment', c.id, userId);
      }
      setCommentHeartMap(map);
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleHeartPress = useCallback(async () => {
    if (!post) return;
    const wasHearted = hearted;
    try {
      await toggleHeart('post', post.id, userId, post.userId);
      setHearted((prev) => !prev);
      setHeartCount((prev) => (wasHearted ? prev - 1 : prev + 1));
    } catch {
      showToast('오류가 발생했어요. 다시 시도해 주세요.');
    }
  }, [post, userId, hearted, showToast]);

  const handleCommentHeartPress = useCallback(
    async (comment: Comment) => {
      const hadHeart = commentHeartMap[comment.id] ?? false;
      try {
        await toggleHeart(
          'comment',
          comment.id,
          userId,
          undefined,
          comment.userId,
          post?.id,
        );
        setCommentHeartMap((prev) => ({
          ...prev,
          [comment.id]: !hadHeart,
        }));
        setComments((prev) =>
          prev.map((c) =>
            c.id === comment.id
              ? {
                  ...c,
                  heartCount: hadHeart
                    ? (c.heartCount ?? 0) - 1
                    : (c.heartCount ?? 0) + 1,
                }
              : c,
          ),
        );
      } catch {
        showToast('오류가 발생했어요. 다시 시도해 주세요.');
      }
    },
    [userId, commentHeartMap, post, showToast],
  );

  const handleDeletePost = useCallback(async () => {
    if (!post) return;
    const ok = await deletePost(post.id, userId);
    if (ok) {
      showToast('글이 삭제되었어요.');
      navigation.goBack();
    }
  }, [post, userId, navigation, showToast]);

  const handleSubmitComment = useCallback(async () => {
    const trimmed = commentText.trim();
    if (!trimmed || !post) return;
    setSubmitting(true);
    try {
      const comment = await createComment(post.id, userId, trimmed);
      if (comment) {
        setComments((prev) => [...prev, comment]);
        setCommentText('');
      } else {
        showToast('등록할 수 없는 내용이에요.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [commentText, post, userId, showToast]);

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      const ok = await deleteComment(commentId, userId);
      if (ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        showToast('댓글이 삭제되었어요.');
      }
    },
    [userId, showToast],
  );

  const handleReportPost = useCallback(async () => {
    if (!post) return;
    await reportPost(post.id, userId);
    showToast('신고했어요.');
  }, [post, userId, showToast]);

  const handleReportComment = useCallback(
    async (commentId: string) => {
      await reportComment(commentId, userId);
      showToast('신고했어요.');
    },
    [userId, showToast],
  );

  if (loading || !post) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <PageNavbar>
          <PageNavbar.Title>상세</PageNavbar.Title>
        </PageNavbar>
        <View style={styles.center}>
          <Txt typography="t5" color={theme.textSecondary}>
            {loading ? '불러오는 중...' : '글을 찾을 수 없어요.'}
          </Txt>
        </View>
      </View>
    );
  }

  const isPostOwner = post.userId === userId;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PageNavbar>
        <PageNavbar.Title>상세</PageNavbar.Title>
      </PageNavbar>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.postSection}>
            <View style={styles.postCard}>
              <Txt
                typography="t6"
                color={theme.textPrimary}
                fontWeight="semiBold"
              >
                {post.nickname}
              </Txt>
              <Txt
                typography="t5"
                color={theme.textSecondary}
                style={styles.postContent}
              >
                {post.content}
              </Txt>
              <View style={styles.postActions}>
                <HeartButton
                  pressed={hearted}
                  onPress={handleHeartPress}
                  count={heartCount}
                />
                <View style={styles.postButtons}>
                  {isPostOwner && (
                    <TextButton
                      variant="arrow"
                      typography="t6"
                      onPress={handleDeletePost}
                    >
                      삭제
                    </TextButton>
                  )}
                  <TextButton
                    variant="arrow"
                    typography="t6"
                    onPress={handleReportPost}
                  >
                    신고하기
                  </TextButton>
                </View>
              </View>
            </View>
            <Txt
              typography="t6"
              color={theme.textPrimary}
              style={styles.commentHeader}
            >
              댓글 {comments.length}개
            </Txt>
          </View>
        }
        renderItem={({ item }) => (
          <List rowSeparator="indented">
            <CommentItem
              comment={item}
              displayName={getCommentDisplayName(item, post.userId, comments)}
              isOwner={item.userId === userId}
              onDelete={
                item.userId === userId
                  ? () => handleDeleteComment(item.id)
                  : undefined
              }
              onReport={() => handleReportComment(item.id)}
              onHeartPress={() => handleCommentHeartPress(item)}
              hasHeart={commentHeartMap[item.id] ?? false}
            />
          </List>
        )}
      />
      <View style={styles.commentInput}>
        <TextArea
          placeholder="댓글을 입력하세요"
          value={commentText}
          onChangeText={setCommentText}
          maxLength={MAX_CONTENT_LENGTH}
          textAreaStyle={styles.commentTextArea}
          containerStyle={styles.textAreaContainer}
        />
        <Button
          viewStyle={styles.submitButton}
          type="primary"
          size="big"
          display="full"
          onPress={handleSubmitComment}
          loading={submitting}
          disabled={!commentText.trim() || submitting}
        >
          전송
        </Button>
      </View>
      <Toast open={toast.open} text={toast.text} onClose={closeToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postSection: {
    padding: 20,
    backgroundColor: theme.cardBackground,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 16,
  },
  postCard: {
    marginBottom: 16,
  },
  postContent: {
    marginVertical: 10,
    lineHeight: 22,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  commentHeader: {
    marginBottom: 8,
  },
  commentInput: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'column',
    gap: 12,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  textAreaContainer: {
    paddingHorizontal: 0,
  },
  commentTextArea: {
    minHeight: 120,
  },
});
