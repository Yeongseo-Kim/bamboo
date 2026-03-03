import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { theme } from '../theme';

/**
 * PostCard의 형태를 모방한 스켈레톤 로딩 컴포넌트.
 * shimmer 애니메이션으로 로딩 중임을 표시합니다.
 */
export function SkeletonPostCard() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      {/* 닉네임 */}
      <View style={[styles.line, styles.lineShort]} />
      {/* 본문 3줄 */}
      <View style={[styles.line, styles.lineFull, { marginTop: 12 }]} />
      <View style={[styles.line, styles.lineFull]} />
      <View style={[styles.line, styles.lineMid]} />
      {/* 하트 버튼 영역 */}
      <View style={styles.actionsRow}>
        <View style={[styles.line, styles.lineAction]} />
      </View>
    </Animated.View>
  );
}

const SKELETON_COLOR = '#E2E8F0';

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  line: {
    backgroundColor: SKELETON_COLOR,
    borderRadius: 6,
    height: 14,
    marginBottom: 8,
  },
  lineShort: {
    width: '30%',
    height: 12,
  },
  lineFull: {
    width: '100%',
  },
  lineMid: {
    width: '65%',
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: 'row',
  },
  lineAction: {
    width: 60,
    height: 12,
  },
});
