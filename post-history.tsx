export interface PostRecord {
  id: string | number;
  title: string;
  category: string;
  status: 'pending' | 'published' | 'failed';
  timestamp: string;
  url?: string;
  error?: string;
  imageUrl?: string;
  wordpressId?: number;
}

export class PostHistoryManager {
  private readonly STORAGE_KEY = 'blog_post_history';
  private readonly MAX_RECORDS = 100;

  getHistory(): PostRecord[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const history = JSON.parse(stored);
      return Array.isArray(history) ? history : [];
    } catch (error) {
      console.error('Failed to load history:', error);
      return [];
    }
  }

  addPost(post: Omit<PostRecord, 'timestamp'>): PostRecord {
    const newPost: PostRecord = {
      ...post,
      timestamp: new Date().toISOString(),
    };

    const history = this.getHistory();
    const updated = [newPost, ...history].slice(0, this.MAX_RECORDS);
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save history:', error);
    }

    return newPost;
  }

  updatePostStatus(
    id: string | number, 
    status: PostRecord['status'], 
    additionalData?: Partial<PostRecord>
  ): void {
    const history = this.getHistory();
    const index = history.findIndex(p => p.id === id);
    
    if (index !== -1) {
      history[index] = {
        ...history[index],
        status,
        ...additionalData,
      };
      
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.error('Failed to update history:', error);
      }
    }
  }

  getStatsByCategory(): Record<string, { total: number; success: number; failed: number }> {
    const history = this.getHistory();
    const stats: Record<string, { total: number; success: number; failed: number }> = {};

    history.forEach(post => {
      if (!stats[post.category]) {
        stats[post.category] = { total: 0, success: 0, failed: 0 };
      }
      
      stats[post.category].total++;
      
      if (post.status === 'published') {
        stats[post.category].success++;
      } else if (post.status === 'failed') {
        stats[post.category].failed++;
      }
    });

    return stats;
  }

  getTodayPostCount(): number {
    const today = new Date().toDateString();
    const history = this.getHistory();
    
    return history.filter(post => {
      const postDate = new Date(post.timestamp).toDateString();
      return postDate === today && post.status === 'published';
    }).length;
  }

  getMonthlyPostCount(): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const history = this.getHistory();
    
    return history.filter(post => {
      const postDate = new Date(post.timestamp);
      return postDate.getMonth() === currentMonth && 
             postDate.getFullYear() === currentYear && 
             post.status === 'published';
    }).length;
  }

  getSuccessRate(): number {
    const history = this.getHistory();
    if (history.length === 0) return 100;
    
    const successful = history.filter(p => p.status === 'published').length;
    return Math.round((successful / history.length) * 100);
  }

  clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }

  exportToCSV(): string {
    const history = this.getHistory();
    const headers = ['ID', 'Title', 'Category', 'Status', 'Timestamp', 'URL'];
    
    const rows = history.map(post => [
      post.id,
      `"${post.title.replace(/"/g, '""')}"`,
      post.category,
      post.status,
      post.timestamp,
      post.url || ''
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}
