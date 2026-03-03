import { ListRow, Txt } from '@toss/tds-react-native';
import { Path, Svg } from '@granite-js/native/react-native-svg';
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
              <View style={styles.commentCount}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2C6.48 2 2 6.03 2 11c0 2.7 1.24 5.12 3.2 6.8L4 21l4.2-1.4C9.37 20.17 10.66 20.4 12 20.4c5.52 0 10-4.03 10-9.2S17.52 2 12 2z"
                    stroke={theme.textTertiary}
                    strokeWidth={1.8}
                    strokeLinejoin="round"
                  />
                </Svg>
                <Txt typography="t7" color={theme.textTertiary}>
                  {post.commentCount ?? 0}
                </Txt>
              </View>
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
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 8,
  },
});
