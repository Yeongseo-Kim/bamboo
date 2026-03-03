export interface Post {
  id: string;
  userId: string;
  content: string;
  nickname: string;
  createdAt: number;
  heartCount: number;
  commentCount: number;
  reportCount: number;
  isHidden: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: number;
  reportCount: number;
  isHidden: boolean;
  heartCount: number;
}

export interface Heart {
  postId: string; // Deprecated: use targetId
  userId: string;
  targetType?: 'post' | 'comment';
  targetId?: string;
}

export interface Report {
  id: string;
  targetType: 'post' | 'comment';
  targetId: string;
  userId: string;
  createdAt: number;
}

export interface Notification {
  id: string;
  userId: string; // 수신자
  type:
  | 'comment_on_post'
  | 'comment_on_participated'
  | 'like_post'
  | 'like_comment';
  targetId: string; // post id or comment id
  postId: string; // 이동할 게시글 ID (편의상 추가)
  fromUserId: string; // 발신자
  message: string;
  isRead: boolean;
  createdAt: number;
}
