import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.code}>404</Text>
      <Text style={styles.message}>페이지를 찾을 수 없습니다</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  code: {
    fontSize: 48,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#888',
  },
});
