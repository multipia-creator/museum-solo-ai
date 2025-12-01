/**
 * Museum Solo AI - Dashboard Controller
 * World-Class Dashboard with Real-time Updates
 */

class DashboardController {
  constructor() {
    this.apiBase = '/api';
    this.state = {
      topTasks: [],
      projects: [],
      budget: null,
      analytics: null,
    };
    this.init();
  }

  async init() {
    console.log('[Dashboard] Initializing...');
    
    // Load all data
    await Promise.all([
      this.loadTopPriorityTasks(),
      this.loadProjects(),
      this.loadBudget(),
      this.loadAnalytics(),
    ]);

    // Setup real-time sync
    this.setupSSE();

    // Setup auto-refresh every 5 minutes
    setInterval(() => this.refreshAll(), 5 * 60 * 1000);
  }

  /**
   * Load top 3 priority tasks
   */
  async loadTopPriorityTasks() {
    try {
      const response = await fetch(`${this.apiBase}/priority/top-tasks`);
      const data = await response.json();

      if (data.success) {
        this.state.topTasks = data.data;
        this.renderPriorityCards();
      }
    } catch (error) {
      console.error('[Dashboard] Load priority tasks error:', error);
      this.renderPriorityCardsError();
    }
  }

  /**
   * Load projects
   */
  async loadProjects() {
    try {
      const response = await fetch(`${this.apiBase}/projects`);
      const data = await response.json();

      if (data.success) {
        this.state.projects = data.data;
        this.renderProjects();
      }
    } catch (error) {
      console.error('[Dashboard] Load projects error:', error);
    }
  }

  /**
   * Load budget summary
   */
  async loadBudget() {
    try {
      const response = await fetch(`${this.apiBase}/budget/summary`);
      const data = await response.json();

      if (data.success) {
        this.state.budget = data.data;
        this.renderKPICards();
      }
    } catch (error) {
      console.error('[Dashboard] Load budget error:', error);
    }
  }

  /**
   * Load analytics summary
   */
  async loadAnalytics() {
    try {
      const response = await fetch(`${this.apiBase}/analytics/summary`);
      const data = await response.json();

      if (data.success) {
        this.state.analytics = data.data;
        this.renderKPICards();
      }
    } catch (error) {
      console.error('[Dashboard] Load analytics error:', error);
    }
  }

  /**
   * Render priority cards
   */
  renderPriorityCards() {
    const container = document.getElementById('priority-cards-container');
    
    if (this.state.topTasks.length === 0) {
      container.innerHTML = `
        <div class="col-span-3 text-center py-12">
          <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
          <h3 class="text-xl font-bold mb-2">모든 긴급 작업 완료!</h3>
          <p class="text-gray-400">새로운 작업을 추가하거나 휴식을 취하세요 😊</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.state.topTasks.map((item, index) => {
      const { task, urgencyScore, recommendation } = item;
      const urgencyClass = urgencyScore >= 8 ? 'priority-urgent' : '';
      const urgencyIcon = urgencyScore >= 8 ? '🚨' : urgencyScore >= 6 ? '⚠️' : '📌';
      const urgencyText = urgencyScore >= 8 ? '긴급' : urgencyScore >= 6 ? '중요' : '보통';
      
      return `
        <div class="priority-card ${urgencyClass}">
          <div class="flex items-center justify-between mb-3">
            <span class="px-3 py-1 rounded-full text-xs font-semibold" 
                  style="background: rgba(239, 68, 68, 0.2); color: #fca5a5;">
              ${urgencyIcon} ${urgencyText}
            </span>
            <span class="px-3 py-1 rounded-full text-xs font-semibold"
                  style="background: rgba(168, 85, 247, 0.2); color: #c084fc;">
              ${this.getCategoryLabel(task.category)}
            </span>
          </div>

          <h4 class="text-lg font-bold mb-3 line-clamp-2">${task.title}</h4>

          <div class="flex flex-col gap-2 mb-3 text-sm text-gray-400">
            <div class="flex items-center gap-2">
              <i class="fas fa-clock"></i>
              <span>마감: ${this.formatDeadline(task.due_date)}</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="fas fa-hourglass-half"></i>
              <span>예상: ${task.estimated_hours || 1}시간</span>
            </div>
          </div>

          <div class="mb-4 p-3 rounded-lg" style="background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6;">
            <div class="flex items-start gap-2 text-sm" style="color: #93c5fd;">
              <i class="fas fa-robot mt-1"></i>
              <span>${recommendation}</span>
            </div>
          </div>

          <button class="btn-primary w-full" onclick="dashboard.startTask(${task.id})">
            <i class="fas fa-play-circle"></i>
            즉시 시작
          </button>
        </div>
      `;
    }).join('');
  }

  /**
   * Render priority cards error state
   */
  renderPriorityCardsError() {
    const container = document.getElementById('priority-cards-container');
    container.innerHTML = `
      <div class="col-span-3 text-center py-12">
        <i class="fas fa-exclamation-triangle text-6xl text-yellow-500 mb-4"></i>
        <h3 class="text-xl font-bold mb-2">데이터를 불러올 수 없습니다</h3>
        <p class="text-gray-400 mb-4">나중에 다시 시도해주세요</p>
        <button class="btn-primary" onclick="dashboard.refreshPriority()">
          <i class="fas fa-sync-alt"></i>
          다시 시도
        </button>
      </div>
    `;
  }

  /**
   * Render KPI cards
   */
  renderKPICards() {
    const container = document.getElementById('kpi-cards-container');
    
    const exhibitionData = this.getExhibitionStats();
    const collectionData = this.getCollectionStats();
    const educationData = this.getEducationStats();
    const budgetData = this.state.budget;

    container.innerHTML = `
      <!-- Exhibition Card -->
      <div class="glass-card rounded-2xl p-6">
        <div class="text-4xl mb-3">🎨</div>
        <h4 class="text-lg font-semibold mb-3">전시 현황</h4>
        <div class="space-y-2 mb-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">진행중</span>
            <span class="font-bold">${exhibitionData.ongoing}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">예정</span>
            <span class="font-bold">${exhibitionData.upcoming}</span>
          </div>
        </div>
        ${exhibitionData.alert ? `
          <div class="p-2 rounded-lg text-xs" style="background: rgba(239, 68, 68, 0.1); color: #fca5a5;">
            <i class="fas fa-exclamation-triangle mr-1"></i>
            ${exhibitionData.alert}
          </div>
        ` : ''}
      </div>

      <!-- Collection Card -->
      <div class="glass-card rounded-2xl p-6">
        <div class="text-4xl mb-3">📦</div>
        <h4 class="text-lg font-semibold mb-3">소장품 관리</h4>
        <div class="space-y-2 mb-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">총 소장품</span>
            <span class="font-bold">${collectionData.total}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">보존 필요</span>
            <span class="font-bold">${collectionData.needConservation}</span>
          </div>
        </div>
        ${collectionData.alert ? `
          <div class="p-2 rounded-lg text-xs" style="background: rgba(251, 146, 60, 0.1); color: #fdba74;">
            <i class="fas fa-info-circle mr-1"></i>
            ${collectionData.alert}
          </div>
        ` : ''}
      </div>

      <!-- Education Card -->
      <div class="glass-card rounded-2xl p-6">
        <div class="text-4xl mb-3">📚</div>
        <h4 class="text-lg font-semibold mb-3">교육/연구</h4>
        <div class="space-y-2 mb-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">프로그램</span>
            <span class="font-bold">${educationData.programs}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">참가자</span>
            <span class="font-bold">${educationData.participants}</span>
          </div>
        </div>
        ${this.state.analytics ? `
          <div class="p-2 rounded-lg text-xs" style="background: rgba(59, 130, 246, 0.1); color: #93c5fd;">
            <i class="fas fa-lightbulb mr-1"></i>
            이번 주 ${this.state.analytics.completedThisWeek}개 작업 완료
          </div>
        ` : ''}
      </div>

      <!-- Budget Card -->
      <div class="glass-card rounded-2xl p-6">
        <div class="text-4xl mb-3">💰</div>
        <h4 class="text-lg font-semibold mb-3">예산 현황</h4>
        ${budgetData ? `
          <div class="space-y-2 mb-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">총 예산</span>
              <span class="font-bold">${this.formatKRW(budgetData.total)}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">사용률</span>
              <span class="font-bold">${this.getBudgetUsagePercentage(budgetData.spent, budgetData.total)}%</span>
            </div>
          </div>
          ${this.isBudgetAtRisk(budgetData.spent, budgetData.total) ? `
            <div class="p-2 rounded-lg text-xs" style="background: rgba(239, 68, 68, 0.1); color: #fca5a5;">
              <i class="fas fa-exclamation-triangle mr-1"></i>
              예산 초과 위험
            </div>
          ` : ''}
        ` : '<div class="text-sm text-gray-400">데이터 로딩 중...</div>'}
      </div>
    `;
  }

  /**
   * Render projects grid
   */
  renderProjects(filter = 'all') {
    const container = document.getElementById('projects-container');
    let projects = this.state.projects;

    if (filter !== 'all') {
      projects = projects.filter(p => p.status === filter);
    }

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="col-span-3 text-center py-12">
          <i class="fas fa-folder-open text-6xl text-gray-600 mb-4"></i>
          <p class="text-gray-400">프로젝트가 없습니다</p>
        </div>
      `;
      return;
    }

    container.innerHTML = projects.map(project => {
      const statusColors = {
        planning: { bg: 'rgba(59, 130, 246, 0.2)', text: '#93c5fd', label: '계획중' },
        in_progress: { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80', label: '진행중' },
        completed: { bg: 'rgba(148, 163, 184, 0.2)', text: '#cbd5e1', label: '완료' },
        on_hold: { bg: 'rgba(251, 146, 60, 0.2)', text: '#fdba74', label: '보류' },
      };

      const status = statusColors[project.status] || statusColors.planning;
      const budgetUsage = this.getBudgetUsagePercentage(project.spent || 0, project.budget || 1);
      const isOverBudget = budgetUsage > 85;

      return `
        <div class="glass-card rounded-2xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg font-bold flex-1 line-clamp-1">${project.title}</h4>
            <span class="px-3 py-1 rounded-full text-xs font-semibold ml-2" 
                  style="background: ${status.bg}; color: ${status.text};">
              ${status.label}
            </span>
          </div>

          <p class="text-sm text-gray-400 mb-4 line-clamp-2">${project.description || '설명 없음'}</p>

          <div class="flex flex-col gap-2 mb-4 text-sm text-gray-400">
            <div class="flex items-center gap-2">
              <i class="fas fa-calendar"></i>
              <span>${this.formatDateRange(project.start_date, project.end_date)}</span>
            </div>
            ${project.budget ? `
              <div class="flex items-center gap-2">
                <i class="fas fa-dollar-sign"></i>
                <span>예산 ${budgetUsage}%</span>
                ${isOverBudget ? '<span class="text-red-400 text-xs">⚠️ 초과위험</span>' : ''}
              </div>
            ` : ''}
          </div>

          <div class="grid grid-cols-3 gap-2">
            <button class="btn-secondary text-center" onclick="dashboard.openWorkflow(${project.id})">
              <i class="fas fa-project-diagram"></i>
            </button>
            <button class="btn-secondary text-center" onclick="dashboard.openBudget(${project.id})">
              <i class="fas fa-chart-pie"></i>
            </button>
            <button class="btn-secondary text-center" onclick="dashboard.openAnalytics(${project.id})">
              <i class="fas fa-chart-line"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Setup Server-Sent Events for real-time updates
   */
  setupSSE() {
    const eventSource = new EventSource(`${this.apiBase}/sync/stream`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('[Dashboard] SSE event:', data.type);

      if (data.type === 'state_update') {
        this.handleStateUpdate(data.data);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[Dashboard] SSE error:', error);
    };
  }

  /**
   * Handle state update from SSE
   */
  handleStateUpdate(data) {
    const { key, value } = data;

    switch (key) {
      case 'topPriorityTasks':
        this.state.topTasks = value;
        this.renderPriorityCards();
        break;
      case 'projects':
        this.state.projects = value;
        this.renderProjects();
        break;
      case 'budget':
        this.state.budget = value;
        this.renderKPICards();
        break;
      case 'analytics':
        this.state.analytics = value;
        this.renderKPICards();
        break;
    }
  }

  /**
   * Utility: Get category label
   */
  getCategoryLabel(category) {
    const labels = {
      exhibition: '전시',
      education: '교육',
      collection: '수집보존',
      publication: '출판',
      research: '연구',
      admin: '행정',
    };
    return labels[category] || category;
  }

  /**
   * Utility: Format deadline
   */
  formatDeadline(dueDate) {
    if (!dueDate) return '마감일 없음';

    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diff < 0) return `${Math.abs(diff)}일 지남`;
    if (diff === 0) return '오늘';
    if (diff === 1) return '내일';
    return `${diff}일 전`;
  }

  /**
   * Utility: Format date range
   */
  formatDateRange(start, end) {
    if (!start && !end) return '기간 미정';
    if (!end) return `${start} ~`;
    return `${start} ~ ${end}`;
  }

  /**
   * Utility: Format KRW
   */
  formatKRW(amount) {
    return `${Math.round(amount / 10000)}만원`;
  }

  /**
   * Utility: Get budget usage percentage
   */
  getBudgetUsagePercentage(spent, total) {
    if (total === 0) return 0;
    return Math.round((spent / total) * 100);
  }

  /**
   * Utility: Check if budget is at risk
   */
  isBudgetAtRisk(spent, total) {
    return this.getBudgetUsagePercentage(spent, total) >= 85;
  }

  /**
   * Get exhibition stats
   */
  getExhibitionStats() {
    const exhibitionProjects = this.state.projects.filter(p => p.category === 'exhibition');
    return {
      ongoing: exhibitionProjects.filter(p => p.status === 'in_progress').length,
      upcoming: exhibitionProjects.filter(p => p.status === 'planning').length,
      alert: exhibitionProjects.length > 2 ? '진행 중인 전시가 많습니다' : null,
    };
  }

  /**
   * Get collection stats
   */
  getCollectionStats() {
    return {
      total: 1247, // Mock data
      needConservation: 8,
      alert: '8점 보존 처리 필요',
    };
  }

  /**
   * Get education stats
   */
  getEducationStats() {
    const educationProjects = this.state.projects.filter(p => p.category === 'education');
    return {
      programs: educationProjects.length,
      participants: 45, // Mock data
    };
  }

  /**
   * Actions
   */
  async startTask(taskId) {
    console.log('[Dashboard] Starting task:', taskId);
    // TODO: Navigate to workflow with task context
    alert(`작업 ${taskId}을(를) 시작합니다.\n워크플로우 페이지로 이동합니다.`);
  }

  openWorkflow(projectId) {
    console.log('[Dashboard] Open workflow:', projectId);
    window.location.href = `/workflow.html?project=${projectId}`;
  }

  openBudget(projectId) {
    console.log('[Dashboard] Open budget:', projectId);
    window.location.href = `/budget.html?project=${projectId}`;
  }

  openAnalytics(projectId) {
    console.log('[Dashboard] Open analytics:', projectId);
    window.location.href = `/analytics.html?project=${projectId}`;
  }

  async refreshPriority() {
    await this.loadTopPriorityTasks();
  }

  async refreshAll() {
    await this.init();
  }
}

// Global functions
function filterProjects(filter) {
  dashboard.renderProjects(filter);
}

function navigate(page) {
  if (page === 'dashboard') return;
  window.location.href = `/${page}.html`;
}

function showNotifications() {
  alert('알림 기능은 곧 추가됩니다!');
}

function showSettings() {
  alert('설정 기능은 곧 추가됩니다!');
}

// Initialize dashboard
const dashboard = new DashboardController();
