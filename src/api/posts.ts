import { PAGE_SIZE } from '../constants';
import * as store from './store';

export async function fetchPosts(lastId?: string) {
  return store.getPosts(PAGE_SIZE, lastId);
}

export async function fetchPost(id: string) {
  return store.getPost(id);
}

export async function createPost(content: string, userId: string) {
  return store.createPost(userId, content);
}

export async function deletePost(postId: string, userId: string) {
  return store.deletePost(postId, userId);
}
