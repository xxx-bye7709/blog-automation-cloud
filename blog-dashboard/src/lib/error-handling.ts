// lib/error-handling.ts - エラーハンドリングユーティリティ

import { ApiResponse, AppError, ErrorReport, NotificationType } from '@/types';

// ==================== エラーハンドリングクラス ====================

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 100;
  
  private constructor() {}
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  /**
   * エラーを処理して適切なメッセージを返す
   */
  handleError(error: unknown, context?: { component?: string; action?: string }): string {
    const errorReport = this.createErrorReport(error, context);
    this.logError(errorReport);
    
    // ユーザーに表示するメッセージを返す
    if (error instanceof AppError) {
      return error.message;
    } else if (error instanceof Error) {
      return this.getUserFriendlyMessage(error);
    } else {
      return '予期しないエラーが発生しました';
    }
  }
  
  /**
   * エラーレポートを作成
   */
  private createErrorReport(
    error: unknown, 
    context?: { component?: string; action?: string }
  ): ErrorReport {
    const appError = this.normalizeError(error);
    
    return {
      error: appError,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        userId: this.getCurrentUserId()
      },
      handled: true,
      severity: this.getErrorSeverity(appError)
    };
  }
  
  /**
   * エラーを正規化
   */
  private normalizeError(error: unknown): Error | AppError {
    if (error instanceof Error) {
      return error;
    } else if (typeof error === 'string') {
      return new Error(error);
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      return new Error((error as any).message);
    } else {
      return new Error('Unknown error occurred');
    }
  }
  
  /**
   * ユーザーフレンドリーなメッセージに変換
   */
  private getUserFriendlyMessage(error: Error): string {
    const messageMap: Record<string, string> = {
      'Network Error': 'ネットワーク接続を確認してください',
      'Timeout': 'リクエストがタイムアウトしました。再試行してください',
      'Unauthorized': '認証が必要です。ログインしてください',
      'Forbidden': 'このリソースへのアクセス権限がありません',
      'Not Found': 'リクエストされたリソースが見つかりません',
      'Internal Server Error': 'サーバーエラーが発生しました。しばらく待ってから再試行してください',
      'Rate Limit': 'リクエスト制限に達しました。しばらく待ってから再試行してください'
    };
    
    for (const [key, message] of Object.entries(messageMap)) {
      if (error.message.includes(key)) {
        return message;
      }
    }
    
    return '処理中にエラーが発生しました';
  }
  
  /**
   * エラーの重要度を判定
   */
  private getErrorSeverity(error: Error | AppError): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof AppError) {
      if (error.statusCode && error.statusCode >= 500) return 'critical';
      if (error.statusCode && error.statusCode >= 400) return 'medium';
      return 'low';
    }
    
    if (error.message.includes('Network') || error.message.includes('Timeout')) {
      return 'medium';
    }
    
    return 'high';
  }
  
  /**
   * エラーをログに記録
   */
  private logError(errorReport: ErrorReport): void {
    // キューに追加
    this.errorQueue.push(errorReport);
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
    
    // コンソールに出力
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Report:', errorReport);
    } else {
      console.error(`[${errorReport.severity.toUpperCase()}] ${errorReport.error.message}`);
    }
    
    // 本番環境では外部サービスに送信（例：Sentry）
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(errorReport);
    }
  }
  
  /**
   * エラートラッキングサービスに送信
   */
  private sendToErrorTracking(errorReport: ErrorReport): void {
    // Sentry, LogRocket, DataDogなどに送信
    // 実装例:
    // if (window.Sentry) {
    //   window.Sentry.captureException(errorReport.error, {
    //     contexts: { custom: errorReport.context },
    //     level: errorReport.severity
    //   });
    // }
  }
  
  /**
   * 現在のユーザーIDを取得
   */
  private getCurrentUserId(): string | undefined {
    // 実際の実装では認証システムから取得
    return undefined;
  }
  
  /**
   * エラー履歴を取得
   */
  getErrorHistory(limit?: number): ErrorReport[] {
    return limit ? this.errorQueue.slice(-limit) : [...this.errorQueue];
  }
  
  /**
   * エラー履歴をクリア
   */
  clearErrorHistory(): void {
    this.errorQueue = [];
  }
}

// ==================== 非同期処理ラッパー ====================

/**
 * 非同期処理を安全に実行
 */
export async function safeAsync<T>(
  asyncFunc: () => Promise<T>,
  options?: {
    fallback?: T;
    onError?: (error: Error) => void;
    retries?: number;
    retryDelay?: number;
    context?: { component?: string; action?: string };
  }
): Promise<T | undefined> {
  const { fallback, onError, retries = 0, retryDelay = 1000, context } = options || {};
  const errorHandler = ErrorHandler.getInstance();
  
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await asyncFunc();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < retries) {
        await delay(retryDelay * Math.pow(2, attempt)); // 指数バックオフ
        continue;
      }
      
      errorHandler.handleError(lastError, context);
      
      if (onError) {
        onError(lastError);
      }
      
      if (fallback !== undefined) {
        return fallback;
      }
    }
  }
  
  throw lastError;
}

/**
 * 複数の非同期処理を並列実行
 */
export async function safeParallel<T>(
  asyncFuncs: Array<() => Promise<T>>,
  options?: {
    stopOnError?: boolean;
    maxConcurrent?: number;
  }
): Promise<Array<{ success: boolean; data?: T; error?: Error }>> {
  const { stopOnError = false, maxConcurrent = 5 } = options || {};
  const results: Array<{ success: boolean; data?: T; error?: Error }> = [];
  
  if (maxConcurrent >= asyncFuncs.length) {
    // 全て並列実行
    const promises = asyncFuncs.map(async (func) => {
      try {
        const data = await func();
        return { success: true, data };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        if (stopOnError) throw err;
        return { success: false, error: err };
      }
    });
    
    return Promise.all(promises);
  } else {
    // 同時実行数を制限
    const queue = [...asyncFuncs];
    const executing: Promise<any>[] = [];
    
    while (queue.length > 0 || executing.length > 0) {
      while (executing.length < maxConcurrent && queue.length > 0) {
        const func = queue.shift()!;
        const promise = (async () => {
          try {
            const data = await func();
            results.push({ success: true, data });
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            if (stopOnError) throw err;
            results.push({ success: false, error: err });
          }
        })();
        
        executing.push(promise);
        promise.finally(() => {
          const index = executing.indexOf(promise);
          if (index > -1) executing.splice(index, 1);
        });
      }
      
      if (executing.length > 0) {
        await Promise.race(executing);
      }
    }
    
    return results;
  }
}

// ==================== API呼び出しラッパー ====================

/**
 * APIコールを安全に実行
 */
export async function safeApiCall<T = any>(
  url: string,
  options?: RequestInit & {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
  }
): Promise<ApiResponse<T>> {
  const { timeout = 30000, retries = 2, retryDelay = 1000, ...fetchOptions } = options || {};
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await safeAsync(
      async () => {
        const res = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });
        
        if (!res.ok) {
          throw new AppError(
            `HTTP Error: ${res.status}`,
            `HTTP_${res.status}`,
            res.status,
            res.status >= 500 || res.status === 429
          );
        }
        
        return res.json();
      },
      {
        retries,
        retryDelay,
        context: { action: 'API_CALL', component: url }
      }
    );
    
    return response as ApiResponse<T>;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError('Request timeout', 'TIMEOUT', 408, true);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ==================== ユーティリティ関数 ====================

/**
 * 遅延処理
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * デバウンス処理
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * スロットル処理
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * リトライロジック
 */
export async function withRetry<T>(
  func: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
    shouldRetry?: (error: Error, attempt: number) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay: initialDelay = 1000,
    backoff = true,
    shouldRetry = () => true
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await func();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts || !shouldRetry(lastError, attempt)) {
        throw lastError;
      }
      
      const delayMs = backoff ? initialDelay * Math.pow(2, attempt - 1) : initialDelay;
      await delay(delayMs);
    }
  }
  
  throw lastError!;
}

// ==================== エクスポート ====================

export const errorHandler = ErrorHandler.getInstance();