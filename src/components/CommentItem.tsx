import { ListRow, TextButton, Txt } from '@toss/tds-react-native';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Comment } from '../api/types';
import { theme } from '../theme';
import { HeartButton } from './HeartButton';

interface CommentItemProps {
  comment: Comment;
  displayName: string;
  isOwner: boolean;
  onDelete?: () => void;
  onReport?: () => void;
  onHeartPress: () => void;
  hasHeart: boolean;
}

export function CommentItem({
  comment,
  displayName,
  isOwner,
  onDelete,
  onReport,
  onHeartPress,
  hasHeart,
}: CommentItemProps) {
  const timeAgo = formatDistanceToNow(comment.createdAt, {
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
              {displayName}
            </Txt>
            <Txt typography="t7" color={theme.textTertiary}>
              {timeAgo}
            </Txt>
          </View>
          <Txt typography="t5" color={theme.textSecondary} style={styles.body}>
            {comment.content}
          </Txt>
          <View style={styles.footer}>
            <View style={styles.heartRow}>
              <HeartButton
                pressed={hasHeart}
                onPress={onHeartPress}
                count={comment.heartCount ?? 0}
              />
            </View>
            <View style={styles.actions}>
              {isOwner && onDelete && (
                <TextButton variant="arrow" typography="t6" onPress={onDelete}>
                  삭제
                </TextButton>
              )}
              {onReport && (
                <TextButton variant="arrow" typography="t6" onPress={onReport}>
                  신고하기
                </TextButton>
              )}
            </View>
          </View>
        </View>
      }
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
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
