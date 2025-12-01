/**
 * Museum Solo AI System - Type Definitions
 * World-Class TypeScript Types for MSA Architecture
 */

// ============================================
// Core Domain Types
// ============================================

export type TaskCategory = 
  | 'exhibition'      // 전시
  | 'education'       // 교육
  | 'collection'      // 수집보존
  | 'publication'     // 출판
  | 'research'        // 연구
  | 'admin';          // 행정

export type TaskStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'completed' 
  | 'paused'
  | 'cancelled';

export type ProjectStatus = 
  | 'planning' 
  | 'in_progress' 
  | 'completed' 
  | 'on_hold';

export type Priority = 1 | 2 | 3 | 4 | 5;

export type EnergyLevel = 'high' | 'medium' | 'low';

export type WorkStyle = 'sequential' | 'parallel';

// ============================================
// Database Models
// ============================================

export interface Project {
  id: number;
  title: string;
  description?: string;
  category: TaskCategory;
  status: ProjectStatus;
  start_date?: string; // ISO date
  end_date?: string;
  budget?: number;
  spent?: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  project_id?: number;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: Priority;
  urgency_score?: number;
  estimated_hours?: number;
  actual_hours?: number;
  due_date?: string;
  status: TaskStatus;
  completed_at?: string;
  created_at: string;
  // Relations
  project?: Project;
}

export interface WorkLog {
  id: number;
  task_id: number;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  status: 'in_progress' | 'completed' | 'paused';
  notes?: string;
  created_at: string;
  // Relations
  task?: Task;
}

export interface AIGeneratedContent {
  id: number;
  type: 'label' | 'sns' | 'email' | 'report';
  related_id?: number;
  prompt?: string;
  generated_text: string;
  language?: string;
  approved: boolean;
  generated_at: string;
}

export interface Artwork {
  id: number;
  title: string;
  artist?: string;
  year?: number;
  material?: string;
  size?: string;
  description?: string;
  label_ko?: string;
  label_en?: string;
  label_zh?: string;
  label_generated_at?: string;
  conservation_status?: 'good' | 'needs_attention' | 'urgent';
  last_inspection_date?: string;
  created_at: string;
}

export interface BudgetItem {
  id: number;
  project_id?: number;
  category: TaskCategory;
  item_name: string;
  amount: number;
  spent: number;
  transaction_date?: string;
  notes?: string;
  created_at: string;
  // Relations
  project?: Project;
}

export interface UserPreferences {
  id: number;
  user_id: string;
  work_style: WorkStyle;
  preferred_work_hours?: string;
  notification_settings?: Record<string, any>;
  dashboard_layout?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================
// AI Service Types
// ============================================

export interface AIServiceRequest {
  type: 'label' | 'sns' | 'email' | 'report' | 'insight';
  data: Record<string, any>;
  options?: {
    temperature?: number;
    maxTokens?: number;
    language?: string;
  };
}

export interface AIServiceResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LabelGenerationRequest {
  artwork: Artwork;
  languages: string[];
}

export interface SNSContentRequest {
  project: Project;
  platform: 'instagram' | 'facebook' | 'blog';
}

export interface EmailDraftRequest {
  incomingEmail: string;
  category: string;
}

export interface DailyReportRequest {
  date: string;
  tasks: Task[];
  workLogs: WorkLog[];
}

// ============================================
// Priority Service Types
// ============================================

export interface UrgencyFactors {
  deadline: number;
  impact: number;
  dependency: number;
  complexity: number;
}

export interface PriorityCalculationResult {
  task: Task;
  urgencyScore: number;
  factors: UrgencyFactors;
  recommendation: string;
}

export interface ScheduleSlot {
  time: string;
  tasks: Task[];
  energy: EnergyLevel;
}

export interface DailySchedule {
  date: string;
  morning: ScheduleSlot;
  afternoon: ScheduleSlot;
  evening: ScheduleSlot;
  totalEstimatedHours: number;
  aiRecommendation?: string;
}

// ============================================
// Workflow Service Types
// ============================================

export interface WorkflowNode {
  id: string;
  type: string;
  title: string;
  description?: string;
  x: number;
  y: number;
  data?: Record<string, any>;
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Workflow {
  id: number;
  project_id?: number;
  name: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  created_at: string;
  updated_at: string;
}

// ============================================
// Data Service Types
// ============================================

export interface CentralState {
  user: {
    id: string;
    email: string;
    name: string;
    preferences?: UserPreferences;
  } | null;
  currentProject: Project | null;
  projects: Project[];
  tasks: Task[];
  topPriorityTasks: Task[]; // Top 3
  budget: {
    total: number;
    spent: number;
    remaining: number;
    byCategory: Record<TaskCategory, number>;
  };
  analytics: {
    completedThisWeek: number;
    hoursThisWeek: number;
    topCategory: TaskCategory | null;
  };
  workflows: Workflow[];
}

export type StateKey = keyof CentralState;

export interface StateUpdate {
  key: StateKey;
  value: any;
  timestamp: number;
}

export interface StateObserver {
  callback: (key: StateKey, value: any) => void;
}

// ============================================
// API Response Types
// ============================================

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================
// Event Types (SSE)
// ============================================

export interface SSEEvent {
  type: 'state_update' | 'task_completed' | 'notification' | 'sync';
  data: any;
  timestamp: number;
}

// ============================================
// UI Component Types
// ============================================

export interface PriorityTaskCardProps {
  task: Task;
  urgencyScore: number;
  aiReason: string;
  onStart: (taskId: number) => void;
}

export interface KPICardProps {
  category: TaskCategory;
  icon: string;
  stats: Record<string, number>;
  alert?: string;
  aiInsight?: string;
}

export interface ProjectCardProps {
  project: Project;
  onOpenCanvas: (projectId: number) => void;
  onOpenBudget: (projectId: number) => void;
  onOpenAnalytics: (projectId: number) => void;
}

// ============================================
// Navigation Context Types
// ============================================

export interface NavigationContext {
  from: string;
  projectId?: number;
  taskId?: number;
  focusNode?: string;
  returnTo?: string;
  timestamp: number;
}

// ============================================
// Cloudflare Bindings
// ============================================

export interface CloudflareEnv {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  OPENAI_API_KEY: string;
  CLOUDFLARE_API_TOKEN: string;
  GITHUB_TOKEN: string;
}

// ============================================
// Hono Context Extension
// ============================================

export type HonoContext = {
  Bindings: CloudflareEnv;
  Variables: {
    user?: {
      id: string;
      email: string;
    };
  };
};
