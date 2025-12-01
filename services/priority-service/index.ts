/**
 * Priority Service - Museum Solo AI System
 * World-Class Priority Algorithm for Task Management
 * 
 * Features:
 * - Urgency calculation (deadline, impact, dependency, complexity)
 * - Top 3 task recommendation
 * - Daily schedule optimization
 * - Energy-based task distribution
 */

import type {
  Task,
  TaskCategory,
  UrgencyFactors,
  PriorityCalculationResult,
  DailySchedule,
  ScheduleSlot,
  UserPreferences,
  EnergyLevel,
} from '../../src/types';

export class PriorityService {
  /**
   * Calculate urgency score for a task
   * Formula: deadline(40%) + impact(30%) + dependency(20%) + complexity(10%)
   */
  calculateUrgencyScore(task: Task): PriorityCalculationResult {
    const factors = this.getUrgencyFactors(task);
    
    const weights = {
      deadline: 0.40,
      impact: 0.30,
      dependency: 0.20,
      complexity: 0.10,
    };

    const urgencyScore = 
      factors.deadline * weights.deadline +
      factors.impact * weights.impact +
      factors.dependency * weights.dependency +
      factors.complexity * weights.complexity;

    return {
      task,
      urgencyScore,
      factors,
      recommendation: this.generateRecommendation(factors, urgencyScore),
    };
  }

  /**
   * Get urgency factors for a task
   */
  private getUrgencyFactors(task: Task): UrgencyFactors {
    return {
      deadline: this.getDeadlineScore(task.due_date),
      impact: this.getImpactScore(task),
      dependency: this.getDependencyScore(task),
      complexity: this.getComplexityScore(task.estimated_hours),
    };
  }

  /**
   * Calculate deadline score (0-10)
   */
  private getDeadlineScore(dueDate?: string): number {
    if (!dueDate) return 2; // Low priority if no deadline

    const now = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (daysUntilDue < 0) return 10; // Overdue!
    if (daysUntilDue <= 1) return 9;
    if (daysUntilDue <= 3) return 8;
    if (daysUntilDue <= 7) return 6;
    if (daysUntilDue <= 14) return 4;
    if (daysUntilDue <= 30) return 3;
    return 2;
  }

  /**
   * Calculate impact score based on category and estimated effort
   */
  private getImpactScore(task: Task): number {
    let score = 0;

    // Category impact (exhibition and education are high priority)
    const categoryImpact: Record<TaskCategory, number> = {
      exhibition: 5,
      education: 4,
      collection: 3,
      publication: 3,
      research: 2,
      admin: 2,
    };
    score += categoryImpact[task.category] || 2;

    // Effort impact (longer tasks = higher impact)
    if (task.estimated_hours) {
      if (task.estimated_hours > 8) score += 3;
      else if (task.estimated_hours > 4) score += 2;
      else score += 1;
    }

    return Math.min(score, 10);
  }

  /**
   * Calculate dependency score (blocking other tasks)
   */
  private getDependencyScore(task: Task): number {
    // In a full implementation, this would check dependency graph
    // For now, we use heuristics based on task properties
    
    // Critical path tasks (early project tasks)
    if (task.category === 'exhibition' || task.category === 'collection') {
      return 5; // Likely blocks other tasks
    }

    return 2; // Default low dependency
  }

  /**
   * Calculate complexity score
   */
  private getComplexityScore(estimatedHours?: number): number {
    if (!estimatedHours) return 2;

    // Higher complexity = should start earlier
    if (estimatedHours > 16) return 8;
    if (estimatedHours > 8) return 6;
    if (estimatedHours > 4) return 4;
    if (estimatedHours > 2) return 3;
    return 2;
  }

  /**
   * Generate human-readable recommendation
   */
  private generateRecommendation(factors: UrgencyFactors, score: number): string {
    const reasons: string[] = [];

    if (factors.deadline >= 8) {
      reasons.push('마감 임박');
    }
    if (factors.impact >= 7) {
      reasons.push('높은 영향도');
    }
    if (factors.dependency >= 5) {
      reasons.push('다른 작업 블로킹');
    }
    if (factors.complexity >= 6) {
      reasons.push('높은 복잡도');
    }

    if (score >= 8) {
      return `🚨 긴급: ${reasons.join(', ')}`;
    } else if (score >= 6) {
      return `⚠️ 중요: ${reasons.join(', ')}`;
    } else if (score >= 4) {
      return `📌 보통: ${reasons.join(', ') || '일반 우선순위'}`;
    } else {
      return `📋 낮음: 여유있게 처리 가능`;
    }
  }

  /**
   * Calculate priority for all tasks and return top 3
   */
  async calculateTopPriorityTasks(tasks: Task[]): Promise<PriorityCalculationResult[]> {
    // Filter only pending tasks
    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

    // Calculate urgency for each task
    const scoredTasks = pendingTasks.map(task => this.calculateUrgencyScore(task));

    // Sort by urgency score (descending)
    scoredTasks.sort((a, b) => b.urgencyScore - a.urgencyScore);

    // Return top 3
    return scoredTasks.slice(0, 3);
  }

  /**
   * Generate optimized daily schedule based on energy levels
   */
  async generateDailySchedule(
    tasks: Task[],
    userPreferences?: UserPreferences
  ): Promise<DailySchedule> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get top 10 priority tasks
    const priorityTasks = await this.calculateTopPriorityTasks(tasks);
    const topTasks = priorityTasks.slice(0, 10).map(pt => pt.task);

    // Categorize tasks by energy level
    const schedule = this.categorizeTasksByEnergy(topTasks, userPreferences);

    // Calculate total estimated hours
    const totalHours = this.calculateTotalHours(schedule);

    return {
      date: today,
      morning: schedule.morning,
      afternoon: schedule.afternoon,
      evening: schedule.evening,
      totalEstimatedHours: totalHours,
      aiRecommendation: this.generateScheduleRecommendation(schedule, totalHours),
    };
  }

  /**
   * Categorize tasks by optimal energy level
   */
  private categorizeTasksByEnergy(
    tasks: Task[],
    userPreferences?: UserPreferences
  ): Pick<DailySchedule, 'morning' | 'afternoon' | 'evening'> {
    const morning: ScheduleSlot = {
      time: '09:00-12:00',
      tasks: [],
      energy: 'high',
    };

    const afternoon: ScheduleSlot = {
      time: '13:00-17:00',
      tasks: [],
      energy: 'medium',
    };

    const evening: ScheduleSlot = {
      time: '17:00-18:00',
      tasks: [],
      energy: 'low',
    };

    // Distribute tasks based on complexity and category
    tasks.forEach(task => {
      const isCreative = task.category === 'exhibition' || task.category === 'research';
      const isComplex = (task.estimated_hours || 0) > 2;

      // High energy (morning): Creative + Complex tasks
      if (isCreative && isComplex) {
        morning.tasks.push(task);
      }
      // Medium energy (afternoon): Medium complexity tasks
      else if (task.category === 'education' || task.category === 'publication') {
        afternoon.tasks.push(task);
      }
      // Low energy (evening): Simple, repetitive tasks
      else {
        evening.tasks.push(task);
      }
    });

    // Balance workload (max 3 hours per slot)
    this.balanceWorkload(morning, afternoon, evening);

    return { morning, afternoon, evening };
  }

  /**
   * Balance workload across time slots
   */
  private balanceWorkload(...slots: ScheduleSlot[]): void {
    const maxHoursPerSlot = 3;

    slots.forEach(slot => {
      let totalHours = slot.tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);

      // If slot is overloaded, move tasks to next slot
      while (totalHours > maxHoursPerSlot && slot.tasks.length > 1) {
        const lastTask = slot.tasks.pop();
        if (lastTask) {
          totalHours -= lastTask.estimated_hours || 0;
        }
      }
    });
  }

  /**
   * Calculate total estimated hours
   */
  private calculateTotalHours(schedule: Pick<DailySchedule, 'morning' | 'afternoon' | 'evening'>): number {
    const allTasks = [
      ...schedule.morning.tasks,
      ...schedule.afternoon.tasks,
      ...schedule.evening.tasks,
    ];

    return allTasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
  }

  /**
   * Generate schedule recommendation
   */
  private generateScheduleRecommendation(
    schedule: Pick<DailySchedule, 'morning' | 'afternoon' | 'evening'>,
    totalHours: number
  ): string {
    const recommendations: string[] = [];

    if (totalHours > 8) {
      recommendations.push('⚠️ 오늘 업무량이 많습니다. 일부 작업을 내일로 연기하는 것을 고려하세요.');
    } else if (totalHours < 4) {
      recommendations.push('✅ 여유로운 하루입니다. 미뤄뒀던 연구나 학습에 시간을 투자하세요.');
    }

    if (schedule.morning.tasks.length === 0) {
      recommendations.push('💡 아침 시간에 창의적인 작업을 배치하면 생산성이 높아집니다.');
    }

    if (schedule.evening.tasks.length > 2) {
      recommendations.push('📋 저녁에는 가벼운 작업 1-2개만 처리하고 휴식을 취하세요.');
    }

    return recommendations.length > 0
      ? recommendations.join('\n')
      : '👍 잘 균형잡힌 스케줄입니다. 집중해서 진행하세요!';
  }

  /**
   * Suggest task time based on current time and energy
   */
  suggestTaskTime(task: Task): {
    recommendedTime: string;
    reason: string;
  } {
    const now = new Date();
    const hour = now.getHours();

    const isCreative = task.category === 'exhibition' || task.category === 'research';
    const isComplex = (task.estimated_hours || 0) > 2;

    // Morning (9-12): High energy
    if (hour >= 9 && hour < 12 && (isCreative || isComplex)) {
      return {
        recommendedTime: '지금 바로',
        reason: '아침 고에너지 시간대 - 창의적/복잡한 작업에 최적',
      };
    }

    // Afternoon (13-17): Medium energy
    if (hour >= 13 && hour < 17) {
      return {
        recommendedTime: '지금 바로',
        reason: '오후 시간대 - 중간 난이도 작업에 적합',
      };
    }

    // Evening (17-18): Low energy
    if (hour >= 17 && hour < 18 && !isCreative && !isComplex) {
      return {
        recommendedTime: '지금 바로',
        reason: '저녁 시간대 - 단순 작업에 적합',
      };
    }

    // Default recommendation
    if (isCreative || isComplex) {
      return {
        recommendedTime: '내일 오전 9-12시',
        reason: '창의적/복잡한 작업은 아침 고에너지 시간대에 처리하세요',
      };
    }

    return {
      recommendedTime: '오후 시간대',
      reason: '일반 작업은 오후에 처리 가능',
    };
  }
}

/**
 * Factory function for creating priority service instance
 */
export function createPriorityService(): PriorityService {
  return new PriorityService();
}

/**
 * Helper: Format urgency score as emoji + percentage
 */
export function formatUrgencyScore(score: number): string {
  const percentage = Math.round(score * 10);
  
  if (score >= 8) return `🚨 ${percentage}%`;
  if (score >= 6) return `⚠️ ${percentage}%`;
  if (score >= 4) return `📌 ${percentage}%`;
  return `📋 ${percentage}%`;
}

/**
 * Helper: Get priority color for UI
 */
export function getPriorityColor(score: number): {
  bg: string;
  border: string;
  text: string;
} {
  if (score >= 8) {
    return {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: '#ef4444',
      text: '#fca5a5',
    };
  }
  if (score >= 6) {
    return {
      bg: 'rgba(251, 146, 60, 0.1)',
      border: '#fb923c',
      text: '#fdba74',
    };
  }
  if (score >= 4) {
    return {
      bg: 'rgba(168, 85, 247, 0.1)',
      border: '#a855f7',
      text: '#c084fc',
    };
  }
  return {
    bg: 'rgba(148, 163, 184, 0.1)',
    border: '#94a3b8',
    text: '#cbd5e1',
  };
}
