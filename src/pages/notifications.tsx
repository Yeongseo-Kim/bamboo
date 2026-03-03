import { createRoute } from '@granite-js/react-native';
import { List, ListRow, Txt } from '@toss/tds-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { getUserId } from '../api/client';
import { fetchNotifications, markNotificationRead } from '../api/notifications';
import type { Notification } from '../api/types';
import { NotificationItem } from '../components/NotificationItem';
import { ROUTES } from '../constants';
import { theme } from '../theme';

export const Route = createRoute('/notifications', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  const userId = getUserId();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchNotifications(userId);
      setNotifications(items);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const items = await fetchNotifications(userId);
      setNotifications(items);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  const handlePress = useCallback(
    async (item: Notification) => {
      if (!item.isRead) {
        await markNotificationRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
        );
      }

      if (item.postId) {
        navigation.navigate(ROUTES.POST_DETAIL, { id: item.postId });
      }
    },
    [navigation],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.settingsRow}>
        <List>
          <ListRow
            contents={
              <View>
                <Txt typography="t4" color={theme.textPrimary}>
                  푸시 알림 설정
                </Txt>
                <Txt typography="t6" color={theme.textSecondary}>
                  수신 on/off
                </Txt>
              </View>
            }
            withArrow
            onPress={() => navigation.navigate(ROUTES.SETTINGS)}
          />
        </List>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Txt typography="t5" color={theme.textSecondary}>
                새로운 알림이 없어요.
              </Txt>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handlePress(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    paddingHorizontal: 0,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
});
