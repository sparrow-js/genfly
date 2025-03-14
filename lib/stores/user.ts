import { atom, map, type MapStore } from 'nanostores';
import { createScopedLogger } from '@/utils/logger';
import { themeStore } from './theme';

const logger = createScopedLogger('UserStore');

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: number;
  platform?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserState {
  isAuthenticated: boolean;
  loading: boolean;
  initialized: boolean;
}

export class UserStore {
  // 用户数据存储
  userData = atom<User | null>(null);
  
  // 用户状态存储
  state: MapStore<UserState> = map({
    isAuthenticated: false,
    loading: false,
    initialized: false
  });

  constructor() {}

  /**
   * 初始化用户状态，使用服务器数据
   */
  initialize(serverUser?: any) {
    this.state.setKey('loading', true);

    try {
      if (serverUser) {
        this.setUser({
          id: serverUser.id,
          email: serverUser.email || '',
          name: serverUser.user_metadata?.name || serverUser.user_metadata?.user_name,
          avatar: serverUser.user_metadata?.avatar_url || serverUser.user_metadata?.avatar,
          role: serverUser.user_metadata?.role || 1,
          platform: serverUser.app_metadata?.provider,
          createdAt: serverUser.created_at || new Date().toISOString(),
          updatedAt: serverUser.updated_at || new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Failed to initialize user:', error);
    } finally {
      this.state.setKey('loading', false);
      this.state.setKey('initialized', true);
    }
  }

  /**
   * 设置用户数据
   */
  setUser(user: User | null) {
    this.userData.set(user);
    this.state.setKey('isAuthenticated', !!user);
  }

  /**
   * 更新用户资料
   */
  updateProfile(profile: Partial<User>) {
    const currentUser = this.userData.get();
    if (currentUser) {
      this.userData.set({
        ...currentUser,
        ...profile,
        updatedAt: new Date().toISOString()
      });
    }
  }

  /**
   * 清除用户数据
   */
  clearUser() {
    this.userData.set(null);
    this.state.set({
      isAuthenticated: false,
      loading: false,
      initialized: true
    });
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): User | null {
    return this.userData.get();
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return this.state.get().isAuthenticated;
  }

  /**
   * 设置加载状态
   */
  setLoading(loading: boolean) {
    this.state.setKey('loading', loading);
  }
}

// 创建单例实例
export const userStore = new UserStore();
