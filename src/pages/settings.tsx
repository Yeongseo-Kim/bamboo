import { createRoute } from '@granite-js/react-native';
import { List, ListRow, Switch, Toast, Txt } from '@toss/tds-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { getUserId } from '../api/client';
import {
  getNotificationPrefs,
  setNotificationPrefs,
} from '../api/notifications';
import { registerUserKeyForPush } from '../api/registerUserKey';
import { useToast } from '../hooks/useToast';
import { theme } from '../theme';

export const Route = createRoute('/settings', {
  component: Page,
});

function Page() {
  const userId = getUserId();
  const { toast, showToast, closeToast } = useToast();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotificationPrefs(userId).then((prefs) => {
      setPushEnabled(prefs.pushEnabled);
      setLoading(false);
    });
  }, [userId]);

  const handlePushToggle = useCallback(
    async (value: boolean) => {
      setPushEnabled(value);
      await setNotificationPrefs(userId, value);

      // 푸시 ON일 때 토스 로그인으로 userKey 등록 (OS 푸시 수신에 필요)
      if (value) {
        const result = await registerUserKeyForPush();
        if (!result.success && result.error) {
          showToast('푸시 수신을 위해 토스 계정 연결이 필요해요.');
        }
      }
    },
    [userId, showToast],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Txt typography="t6" color={theme.textSecondary} style={styles.section}>
          알림
        </Txt>
        <List>
          <ListRow
            contents={
              <View>
                <Txt typography="t4" color={theme.textPrimary}>
                  푸시 알림
                </Txt>
                <Txt typography="t6" color={theme.textSecondary}>
                  댓글, 공감 알림을 푸시로 받아요.
                </Txt>
              </View>
            }
            right={
              !loading ? (
                <Switch
                  checked={pushEnabled}
                  onCheckedChange={handlePushToggle}
                />
              ) : null
            }
          />
        </List>
        <Txt typography="t7" color={theme.textTertiary} style={styles.hint}>
          토스 알림 수신에 동의한 경우에만 푸시를 받을 수 있어요.
        </Txt>
      </View>
      <Toast open={toast.open} text={toast.text} onClose={closeToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 8,
  },
  hint: {
    marginTop: 12,
    lineHeight: 18,
  },
});
