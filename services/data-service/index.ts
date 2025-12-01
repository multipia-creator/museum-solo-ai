/**
 * Data Service - Museum Solo AI System
 * World-Class Centralized State Management with Real-time Sync
 * 
 * Features:
 * - Observer pattern for reactive updates
 * - Server-Sent Events (SSE) for real-time sync
 * - D1/KV/R2 unified interface
 * - Automatic persistence
 */

import type {
  CentralState,
  StateKey,
  StateUpdate,
  StateObserver,
  SSEEvent,
  CloudflareEnv,
  Project,
  Task,
  TaskCategory,
} from '../../src/types';

export class DataService {
  private state: CentralState;
  private observers: StateObserver[] = [];
  private sseController: ReadableStreamDefaultController | null = null;
  private env: CloudflareEnv;

  constructor(env: CloudflareEnv) {
    this.env = env;
    this.state = this.getInitialState();
  }

  /**
   * Get initial empty state
   */
  private getInitialState(): CentralState {
    return {
      user: null,
      currentProject: null,
      projects: [],
      tasks: [],
      topPriorityTasks: [],
      budget: {
        total: 0,
        spent: 0,
        remaining: 0,
        byCategory: {
          exhibition: 0,
          education: 0,
          collection: 0,
          publication: 0,
          research: 0,
          admin: 0,
        },
      },
      analytics: {
        completedThisWeek: 0,
        hoursThisWeek: 0,
        topCategory: null,
      },
      workflows: [],
    };
  }

  /**
   * Get current state
   */
  getState(): Readonly<CentralState> {
    return this.state;
  }

  /**
   * Get specific state value
   */
  getValue<K extends StateKey>(key: K): CentralState[K] {
    return this.state[key];
  }

  /**
   * Update state and notify observers
   */
  async setState<K extends StateKey>(key: K, value: CentralState[K]): Promise<void> {
    // Update state
    this.state[key] = value;

    // Notify observers
    this.notifyObservers(key, value);

    // Persist to KV for quick access
    await this.persistToKV(key, value);

    // Broadcast via SSE
    this.broadcast({
      type: 'state_update',
      data: { key, value },
      timestamp: Date.now(),
    });
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (key: StateKey, value: any) => void): () => void {
    const observer: StateObserver = { callback };
    this.observers.push(observer);

    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Notify all observers
   */
  private notifyObservers(key: StateKey, value: any): void {
    this.observers.forEach(observer => {
      try {
        observer.callback(key, value);
      } catch (error) {
        console.error('[DataService] Observer error:', error);
      }
    });
  }

  /**
   * Persist state to Cloudflare KV
   */
  private async persistToKV(key: StateKey, value: any): Promise<void> {
    try {
      const kvKey = `state:${key}`;
      await this.env.KV.put(kvKey, JSON.stringify(value), {
        expirationTtl: 86400, // 24 hours
      });
    } catch (error) {
      console.error('[DataService] KV persist error:', error);
    }
  }

  /**
   * Load state from KV
   */
  async loadFromKV<K extends StateKey>(key: K): Promise<CentralState[K] | null> {
    try {
      const kvKey = `state:${key}`;
      const data = await this.env.KV.get(kvKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[DataService] KV load error:', error);
    }
    return null;
  }

  /**
   * Initialize SSE stream
   */
  initSSEStream(controller: ReadableStreamDefaultController): void {
    this.sseController = controller;
  }

  /**
   * Broadcast event to all SSE clients
   */
  private broadcast(event: SSEEvent): void {
    if (!this.sseController) return;

    try {
      const message = `data: ${JSON.stringify(event)}\n\n`;
      this.sseController.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      console.error('[DataService] SSE broadcast error:', error);
    }
  }

  /**
   * Load projects from D1
   */
  async loadProjects(userId?: string): Promise<Project[]> {
    try {
      const query = userId
        ? 'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC'
        : 'SELECT * FROM projects ORDER BY updated_at DESC';

      const result = userId
        ? await this.env.DB.prepare(query).bind(userId).all()
        : await this.env.DB.prepare(query).all();

      const projects = result.results as Project[];
      await this.setState('projects', projects);
      return projects;
    } catch (error) {
      console.error('[DataService] Load projects error:', error);
      return [];
    }
  }

  /**
   * Load tasks from D1
   */
  async loadTasks(projectId?: number): Promise<Task[]> {
    try {
      const query = projectId
        ? 'SELECT * FROM tasks WHERE project_id = ? ORDER BY priority DESC, due_date ASC'
        : 'SELECT * FROM tasks ORDER BY priority DESC, due_date ASC';

      const result = projectId
        ? await this.env.DB.prepare(query).bind(projectId).all()
        : await this.env.DB.prepare(query).all();

      const tasks = result.results as Task[];
      await this.setState('tasks', tasks);
      return tasks;
    } catch (error) {
      console.error('[DataService] Load tasks error:', error);
      return [];
    }
  }

  /**
   * Save project to D1
   */
  async saveProject(project: Partial<Project>): Promise<Project | null> {
    try {
      if (project.id) {
        // Update existing
        await this.env.DB.prepare(`
          UPDATE projects 
          SET title = ?, description = ?, category = ?, status = ?,
              start_date = ?, end_date = ?, budget = ?, spent = ?,
              updated_at = ?
          WHERE id = ?
        `).bind(
          project.title,
          project.description,
          project.category,
          project.status,
          project.start_date,
          project.end_date,
          project.budget,
          project.spent,
          new Date().toISOString(),
          project.id
        ).run();
      } else {
        // Insert new
        const result = await this.env.DB.prepare(`
          INSERT INTO projects (title, description, category, status, start_date, end_date, budget, spent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          project.title,
          project.description,
          project.category,
          project.status || 'planning',
          project.start_date,
          project.end_date,
          project.budget || 0,
          project.spent || 0
        ).run();

        project.id = result.meta.last_row_id as number;
      }

      // Reload projects
      await this.loadProjects();

      return project as Project;
    } catch (error) {
      console.error('[DataService] Save project error:', error);
      return null;
    }
  }

  /**
   * Save task to D1
   */
  async saveTask(task: Partial<Task>): Promise<Task | null> {
    try {
      if (task.id) {
        // Update existing
        await this.env.DB.prepare(`
          UPDATE tasks 
          SET title = ?, description = ?, category = ?, priority = ?,
              urgency_score = ?, estimated_hours = ?, actual_hours = ?,
              due_date = ?, status = ?, completed_at = ?
          WHERE id = ?
        `).bind(
          task.title,
          task.description,
          task.category,
          task.priority,
          task.urgency_score,
          task.estimated_hours,
          task.actual_hours,
          task.due_date,
          task.status,
          task.completed_at,
          task.id
        ).run();
      } else {
        // Insert new
        const result = await this.env.DB.prepare(`
          INSERT INTO tasks (project_id, title, description, category, priority, estimated_hours, due_date, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          task.project_id,
          task.title,
          task.description,
          task.category,
          task.priority || 3,
          task.estimated_hours || 1,
          task.due_date,
          task.status || 'pending'
        ).run();

        task.id = result.meta.last_row_id as number;
      }

      // Reload tasks
      await this.loadTasks();

      return task as Task;
    } catch (error) {
      console.error('[DataService] Save task error:', error);
      return null;
    }
  }

  /**
   * Calculate and update budget summary
   */
  async updateBudgetSummary(): Promise<void> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT 
          SUM(amount) as total,
          SUM(spent) as spent,
          category
        FROM budget_items
        GROUP BY category
      `).all();

      const byCategory: Record<TaskCategory, number> = {
        exhibition: 0,
        education: 0,
        collection: 0,
        publication: 0,
        research: 0,
        admin: 0,
      };

      let total = 0;
      let spent = 0;

      result.results.forEach((row: any) => {
        const category = row.category as TaskCategory;
        byCategory[category] = row.total || 0;
        total += row.total || 0;
        spent += row.spent || 0;
      });

      await this.setState('budget', {
        total,
        spent,
        remaining: total - spent,
        byCategory,
      });
    } catch (error) {
      console.error('[DataService] Update budget error:', error);
    }
  }

  /**
   * Calculate and update analytics summary
   */
  async updateAnalyticsSummary(): Promise<void> {
    try {
      // Get this week's date range
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of week
      const weekStartStr = weekStart.toISOString().split('T')[0];

      // Completed tasks this week
      const completedResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM tasks
        WHERE completed_at >= ? AND status = 'completed'
      `).bind(weekStartStr).first();

      // Hours this week
      const hoursResult = await this.env.DB.prepare(`
        SELECT SUM(duration_minutes) as total_minutes
        FROM work_logs
        WHERE start_time >= ?
      `).bind(weekStartStr).first();

      // Top category
      const categoryResult = await this.env.DB.prepare(`
        SELECT category, COUNT(*) as count
        FROM tasks
        WHERE completed_at >= ?
        GROUP BY category
        ORDER BY count DESC
        LIMIT 1
      `).bind(weekStartStr).first();

      await this.setState('analytics', {
        completedThisWeek: (completedResult as any)?.count || 0,
        hoursThisWeek: ((hoursResult as any)?.total_minutes || 0) / 60,
        topCategory: (categoryResult as any)?.category || null,
      });
    } catch (error) {
      console.error('[DataService] Update analytics error:', error);
    }
  }

  /**
   * Full state refresh from database
   */
  async refreshAllState(userId?: string): Promise<void> {
    await Promise.all([
      this.loadProjects(userId),
      this.loadTasks(),
      this.updateBudgetSummary(),
      this.updateAnalyticsSummary(),
    ]);

    this.broadcast({
      type: 'sync',
      data: { message: 'Full state refresh completed' },
      timestamp: Date.now(),
    });
  }
}

/**
 * Factory function for creating data service instance
 */
export function createDataService(env: CloudflareEnv): DataService {
  return new DataService(env);
}

/**
 * Helper: Format budget as Korean Won
 */
export function formatKRW(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/**
 * Helper: Calculate budget usage percentage
 */
export function getBudgetUsagePercentage(spent: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((spent / total) * 100);
}

/**
 * Helper: Check if budget is over threshold
 */
export function isBudgetAtRisk(spent: number, total: number, threshold: number = 0.85): boolean {
  return getBudgetUsagePercentage(spent, total) >= threshold * 100;
}
