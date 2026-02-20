import { ListRow, Txt } from '@toss/tds-react-native';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Notification } from '../api/types';
import { theme } from '../theme';

interface NotificationItemProps {
    notification: Notification;
    onPress: () => void;
}

export function NotificationItem({
    notification,
    onPress,
}: NotificationItemProps) {
    const timeAgo = formatDistanceToNow(notification.createdAt, {
        addSuffix: true,
        locale: ko,
    });

    return (
        <ListRow
            contents={
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Txt typography="t6" fontWeight="semiBold" color={theme.textPrimary}>
                            {notification.message}
                        </Txt>
                        {!notification.isRead && <View style={styles.badge} />}
                    </View>
                    <Txt typography="t7" color={theme.textTertiary}>
                        {timeAgo}
                    </Txt>
                </View>
            }
            onPress={onPress}
            withArrow
        />
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        paddingVertical: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    badge: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.primary,
    },
});
