import { createRoute } from '@granite-js/react-native';
import { Button, TextArea, Toast } from '@toss/tds-react-native';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { getUserId } from '../api/client';
import { createPost } from '../api/posts';
import { MAX_CONTENT_LENGTH } from '../constants';
import { useToast } from '../hooks/useToast';
import { theme } from '../theme';

export const Route = createRoute('/write', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  const userId = getUserId();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast, showToast, closeToast } = useToast();

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      showToast('내용을 입력해 주세요.');
      return;
    }
    if (trimmed.length > MAX_CONTENT_LENGTH) {
      showToast(`최대 ${MAX_CONTENT_LENGTH}자까지 입력할 수 있어요.`);
      return;
    }
    setLoading(true);
    try {
      const post = await createPost(trimmed, userId);
      if (post) {
        showToast('글이 올라갔어요.');
        setContent('');
        navigation.goBack();
      } else {
        showToast('등록할 수 없는 내용이에요.');
      }
    } catch {
      showToast('오류가 발생했어요. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }, [content, userId, showToast, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <TextArea
          placeholder="하고 싶은 말을 적어 보세요. (가입 없이 익명으로 올려요)"
          value={content}
          onChangeText={setContent}
          maxLength={MAX_CONTENT_LENGTH}
          help={`${content.length}/${MAX_CONTENT_LENGTH}`}
          textAreaStyle={styles.textArea}
          containerStyle={styles.textAreaContainer}
        />
        <Button
          viewStyle={styles.submitButton}
          type="primary"
          size="big"
          display="full"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || !content.trim()}
        >
          올리기
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  textArea: {
    minHeight: 220,
  },
  textAreaContainer: {
    paddingHorizontal: 0,
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
