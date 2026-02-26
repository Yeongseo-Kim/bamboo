import { createRoute } from '@granite-js/react-native';
import {
  Button,
  ListFooter,
  Toast,
  Txt,
} from '@toss/tds-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { getUserId } from '../api/client';
import { hasHeart, toggleHeart } from '../api/hearts';
import { fetchPosts } from '../api/posts';
import type { Post } from '../api/types';
import { PostCard } from '../components/PostCard';
import { PAGE_SIZE, ROUTES } from '../constants';
import { useToast } from '../hooks/useToast';
import { theme } from '../theme';

export const Route = createRoute('/', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  const userId = getUserId();
  const { toast, showToast, closeToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [heartMap, setHeartMap] = useState<Record<string, boolean>>({});
  const loadingRef = useRef(false);

  const loadPosts = useCallback(
    async (lastId?: string) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const items = await fetchPosts(lastId);
        if (items.length < PAGE_SIZE) setHasMore(false);
        setPosts((prev) => (lastId ? [...prev, ...items] : items));
        const map: Record<string, boolean> = {};
        for (const p of items) {
          map[p.id] = await hasHeart('post', p.id, userId);
        }
        setHeartMap((prev) => ({ ...prev, ...map }));
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleHeartPress = useCallback(
    async (post: Post) => {
      const hadHeart = heartMap[post.id] ?? false;
      try {
        await toggleHeart('post', post.id, userId, post.userId);
        setHeartMap((prev) => ({
          ...prev,
          [post.id]: !hadHeart,
        }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  heartCount: hadHeart ? p.heartCount - 1 : p.heartCount + 1,
                }
              : p,
          ),
        );
      } catch {
        showToast('오류가 발생했어요. 다시 시도해 주세요.');
      }
    },
    [userId, heartMap, showToast],
  );

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading && posts.length > 0) {
      const lastId = posts[posts.length - 1]?.id;
      loadPosts(lastId);
    }
  }, [hasMore, loading, posts, loadPosts]);

  const handleRefresh = useCallback(async () => {
    if (loadingRef.current || refreshing) return;
    setRefreshing(true);
    setHasMore(true);
    try {
      const items = await fetchPosts();
      setPosts(items);
      const map: Record<string, boolean> = {};
      for (const p of items) {
        map[p.id] = await hasHeart('post', p.id, userId);
      }
      setHeartMap(map);
      if (items.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setRefreshing(false);
    }
  }, [userId, refreshing]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Txt
                typography="t4"
                color={theme.textPrimary}
                style={styles.emptyText}
              >
                말 못할 이야기, 익명으로 외쳐요
              </Txt>
              <Txt
                typography="t6"
                color={theme.emptyMuted}
                style={styles.emptySub}
              >
                아직 글이 없어요. 첫 번째로 외쳐보세요!
              </Txt>
            </View>
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <PostCard
              post={item}
              currentUserId={userId}
              onPress={() =>
                navigation.navigate(ROUTES.POST_DETAIL, { id: item.id })
              }
              onHeartPress={() => handleHeartPress(item)}
              hasHeart={heartMap[item.id] ?? false}
            />
          </View>
        )}
        ListFooterComponent={
          hasMore && posts.length > 0 ? (
            <ListFooter
              title={
                <ListFooter.Title color={theme.textSecondary}>
                  {loading ? '불러오는 중...' : '더 보기'}
                </ListFooter.Title>
              }
              onPress={loading ? undefined : handleLoadMore}
            />
          ) : null
        }
      />
      <View style={styles.ctaWrapper}>
        <Button
          type="primary"
          size="big"
          display="full"
          onPress={() => navigation.navigate(ROUTES.WRITE)}
        >
          글쓰기
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
  ctaWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  separator: {
    height: 12,
  },
  cardWrapper: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
  },
  empty: {
    paddingVertical: 64,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginBottom: 12,
  },
  emptySub: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
