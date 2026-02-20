import { ListRow, Txt } from '@toss/tds-react-native';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Post } from '../api/types';
import { theme } from '../theme';
import { HeartButton } from './HeartButton';

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onPress: () => void;
  onHeartPress: () => void;
  hasHeart: boolean;
}

export function PostCard({
  post,
  currentUserId,
  onPress,
  onHeartPress,
  hasHeart,
}: PostCardProps) {
  const isOwner = post.userId === currentUserId;
  const timeAgo = formatDistanceToNow(post.createdAt, {
    addSuffix: true,
    locale: ko,
  });

  return (
    <ListRow
      contents={
        <View style={styles.content}>
          <View style={styles.header}>
            <Txt
              typography="t6"
              color={theme.textPrimary}
              fontWeight="semiBold"
            >
              {post.nickname}
            </Txt>
            <Txt typography="t7" color={theme.textTertiary}>
              {timeAgo}
            </Txt>
          </View>
          <Txt typography="t5" color={theme.textSecondary} style={styles.body}>
            {post.content}
          </Txt>
          <View style={styles.footer}>
            <View style={styles.heartRow}>
              <HeartButton
                pressed={hasHeart}
                onPress={onHeartPress}
                count={post.heartCount}
              />
            </View>
            {isOwner && (
              <Txt typography="t7" color={theme.textTertiary}>
                내 글
              </Txt>
            )}
          </View>
        </View>
      }
      withArrow
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingVertical: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  body: {
    marginBottom: 10,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
