// hooks/index.ts - カスタムHooks（メモリリーク対策）

import { useEffect, useRef, useState, useCallback, DependencyList } from 'react';
import { safeAsync, debounce, throttle } from '@/lib/error-handling';
import { ApiResponse, Notification, NotificationType } from '@/types';

// ==================== メモリリーク対策Hooks ====================

/**
 * コンポーネントのマウント状態を追跡
 */
export function useMounted(): { current: boolean } {
  const mounted = useRef(true);
  
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  
  return mounted;
}

/**
 * 安全な非同期処理用Hook
 */
export function useSafeAsync<T>() {
  const mounted = useMounted();
  const [state, setState] = useState<{
    loading: boolean;
    error: Error | null;
    data: T | null;
  }>({
    loading: false,
    error: null,
    data: null
  });
  
  const execute = useCallback(async (promise: Promise<T>) => {
    if (!mounted.current) return;
    
    setState({ loading: true, error: null, data: null });
    
    try {
      const data = await promise;
      if (mounted.current) {
        setState({ loading: false, error: null, data });
      }
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (mounted.current) {
        setState({ loading: false, error: err, data: null });
      }
      throw err;
    }
  }, [mounted]);
  
  const reset = useCallback(() => {
    if (mounted.current) {
      setState({ loading: false, error: null, data: null });
    }
  }, [mounted]);
  
  return { ...state, execute, reset };
}

/**
 * インターバル処理用Hook（メモリリーク対策済み）
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  const mounted = useMounted();
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (delay === null) return;
    
    const tick = () => {
      if (mounted.current) {
        savedCallback.current();
      }
    };
    
    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay, mounted]);
}

/**
 * タイムアウト処理用Hook
 */
export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  const mounted = useMounted();
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (delay === null) return;
    
    const id = setTimeout(() => {
      if (mounted.current) {
        savedCallback.current();
      }
    }, delay);
    
    return () => clearTimeout(id);
  }, [delay, mounted]);
}

// ==================== API関連Hooks ====================

/**
 * API呼び出し用Hook
 */
export function useApi<T = any>(url: string, options?: RequestInit) {
  const mounted = useMounted();
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const fetchData = useCallback(async (params?: Record<string, any>) => {
    // 前回のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    if (!mounted.current) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await fetch(url + queryString, {
        ...options,
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (mounted.current) {
        setState({ data, loading: false, error: null });
      }
      
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // キャンセルされた場合は何もしない
      }
      
      const err = error instanceof Error ? error : new Error(String(error));
      if (mounted.current) {
        setState({ data: null, loading: false, error: err });
      }
      throw err;
    }
  }, [url, options, mounted]);
  
  const reset = useCallback(() => {
    if (mounted.current) {
      setState({ data: null, loading: false, error: null });
    }
  }, [mounted]);
  
  useEffect(() => {
    return () => {
      // クリーンアップ時にリクエストをキャンセル
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  return { ...state, fetch: fetchData, reset };
}

/**
 * ポーリング処理用Hook
 */
export function usePolling(
  callback: () => Promise<void>,
  interval: number,
  enabled: boolean = true
) {
  const mounted = useMounted();
  const [isPolling, setIsPolling] = useState(false);
  
  useEffect(() => {
    if (!enabled) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const poll = async () => {
      if (!mounted.current) return;
      
      setIsPolling(true);
      
      try {
        await callback();
      } catch (error) {
        console.error('Polling error:', error);
      } finally {
        if (mounted.current) {
          setIsPolling(false);
          timeoutId = setTimeout(poll, interval);
        }
      }
    };
    
    poll();
    
    return () => {
      clearTimeout(timeoutId);
      setIsPolling(false);
    };
  }, [callback, interval, enabled, mounted]);
  
  return { isPolling };
}

// ==================== 状態管理Hooks ====================

/**
 * ローカルストレージ同期Hook
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const mounted = useMounted();
  
  // 初期値の取得
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  // 値の設定
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      if (!mounted.current) return;
      
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // 他のタブに変更を通知
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: JSON.stringify(valueToStore),
        storageArea: localStorage
      }));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue, mounted]);
  
  // 値のクリア
  const clearValue = useCallback(() => {
    try {
      if (!mounted.current) return;
      
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error clearing localStorage key "${key}":`, error);
    }
  }, [key, initialValue, mounted]);
  
  // 他のタブからの変更を監視
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null && mounted.current) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Error parsing storage value:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, mounted]);
  
  return [storedValue, setValue, clearValue];
}

/**
 * 通知管理Hook
 */
export function useNotifications() {
  const mounted = useMounted();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const showNotification = useCallback((
    message: string,
    type: NotificationType = 'info',
    duration: number = 5000
  ) => {
    if (!mounted.current) return;
    
    const id = Date.now().toString();
    const notification: Notification = {
      id,
      message,
      type,
      timestamp: new Date().toISOString(),
      duration
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // 自動削除
    if (duration > 0) {
      setTimeout(() => {
        if (mounted.current) {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }
      }, duration);
    }
    
    return id;
  }, [mounted]);
  
  const removeNotification = useCallback((id: string) => {
    if (mounted.current) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  }, [mounted]);
  
  const clearNotifications = useCallback(() => {
    if (mounted.current) {
      setNotifications([]);
    }
  }, [mounted]);
  
  return {
    notifications,
    showNotification,
    removeNotification,
    clearNotifications
  };
}

// ==================== パフォーマンス最適化Hooks ====================

/**
 * デバウンス処理Hook
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const mounted = useMounted();
  
  useEffect(() => {
    const handler = setTimeout(() => {
      if (mounted.current) {
        setDebouncedValue(value);
      }
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay, mounted]);
  
  return debouncedValue;
}

/**
 * スロットル処理Hook
 */
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRun = useRef(Date.now());
  const mounted = useMounted();
  
  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRun.current >= delay && mounted.current) {
        setThrottledValue(value);
        lastRun.current = Date.now();
      }
    }, delay - (Date.now() - lastRun.current));
    
    return () => clearTimeout(handler);
  }, [value, delay, mounted]);
  
  return throttledValue;
}

/**
 * ウィンドウサイズ監視Hook
 */
export function useWindowSize() {
  const mounted = useMounted();
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  
  useEffect(() => {
    const handleResize = throttle(() => {
      if (mounted.current) {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }
    }, 200);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mounted]);
  
  return windowSize;
}

/**
 * Intersection Observer Hook
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const mounted = useMounted();
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      if (mounted.current) {
        setIsIntersecting(entry.isIntersecting);
      }
    }, options);
    
    observer.observe(ref.current);
    
    return () => observer.disconnect();
  }, [ref, options, mounted]);
  
  return isIntersecting;
}

// ==================== エクスポート ====================

export default {
  useMounted,
  useSafeAsync,
  useInterval,
  useTimeout,
  useApi,
  usePolling,
  useLocalStorage,
  useNotifications,
  useDebounce,
  useThrottle,
  useWindowSize,
  useIntersectionObserver
};