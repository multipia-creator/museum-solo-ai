-- Museum Solo AI System - Initial Database Schema
-- World-Class D1 SQLite Database Design

-- ============================================
-- Projects Table
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT DEFAULT 'default_user',
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK(category IN ('exhibition', 'education', 'collection', 'publication', 'research', 'admin')),
  status TEXT DEFAULT 'planning' CHECK(status IN ('planning', 'in_progress', 'completed', 'on_hold')),
  start_date DATE,
  end_date DATE,
  budget INTEGER DEFAULT 0,
  spent INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_updated ON projects(updated_at DESC);

-- ============================================
-- Tasks Table
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK(category IN ('exhibition', 'education', 'collection', 'publication', 'research', 'admin')),
  priority INTEGER DEFAULT 3 CHECK(priority BETWEEN 1 AND 5),
  urgency_score REAL,
  estimated_hours REAL,
  actual_hours REAL,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'paused', 'cancelled')),
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_priority ON tasks(priority DESC, due_date ASC);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_urgency ON tasks(urgency_score DESC);

-- ============================================
-- Work Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS work_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  duration_minutes REAL,
  status TEXT CHECK(status IN ('in_progress', 'completed', 'paused')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_work_logs_task ON work_logs(task_id);
CREATE INDEX idx_work_logs_start ON work_logs(start_time DESC);

-- ============================================
-- AI Generated Content Table
-- ============================================
CREATE TABLE IF NOT EXISTS ai_generated_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('label', 'sns', 'email', 'report')),
  related_id INTEGER,
  prompt TEXT,
  generated_text TEXT NOT NULL,
  language TEXT DEFAULT 'ko',
  approved BOOLEAN DEFAULT 0,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_content_type ON ai_generated_content(type);
CREATE INDEX idx_ai_content_related ON ai_generated_content(related_id);

-- ============================================
-- Artworks Table
-- ============================================
CREATE TABLE IF NOT EXISTS artworks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT,
  year INTEGER,
  material TEXT,
  size TEXT,
  description TEXT,
  label_ko TEXT,
  label_en TEXT,
  label_zh TEXT,
  label_generated_at DATETIME,
  conservation_status TEXT CHECK(conservation_status IN ('good', 'needs_attention', 'urgent')),
  last_inspection_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_artworks_artist ON artworks(artist);
CREATE INDEX idx_artworks_conservation ON artworks(conservation_status);

-- ============================================
-- Budget Items Table
-- ============================================
CREATE TABLE IF NOT EXISTS budget_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  category TEXT NOT NULL CHECK(category IN ('exhibition', 'education', 'collection', 'publication', 'research', 'admin')),
  item_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  spent INTEGER DEFAULT 0,
  transaction_date DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_budget_project ON budget_items(project_id);
CREATE INDEX idx_budget_category ON budget_items(category);

-- ============================================
-- User Preferences Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT UNIQUE NOT NULL,
  work_style TEXT DEFAULT 'sequential' CHECK(work_style IN ('sequential', 'parallel')),
  preferred_work_hours TEXT DEFAULT '09:00-18:00',
  notification_settings TEXT, -- JSON
  dashboard_layout TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_prefs_user ON user_preferences(user_id);

-- ============================================
-- Workflows Table
-- ============================================
CREATE TABLE IF NOT EXISTS workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  name TEXT NOT NULL,
  nodes TEXT NOT NULL, -- JSON array
  connections TEXT NOT NULL, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflows_project ON workflows(project_id);

-- ============================================
-- Seed Data (Sample Projects for Testing)
-- ============================================

INSERT INTO projects (title, description, category, status, start_date, end_date, budget, spent) VALUES
('세계 문화유산 순회전', '유네스코 세계문화유산을 소개하는 특별 순회전시', 'exhibition', 'in_progress', '2025-01-15', '2025-03-31', 15000000, 8500000),
('어린이 미술 교육 프로그램', '초등학생 대상 체험형 미술 교육', 'education', 'planning', '2025-02-01', '2025-02-28', 3000000, 500000),
('조선시대 도자기 연구', '조선시대 백자 연구 프로젝트', 'research', 'in_progress', '2025-01-01', '2025-06-30', 5000000, 2000000);

-- Sample tasks
INSERT INTO tasks (project_id, title, category, priority, urgency_score, estimated_hours, due_date, status) VALUES
(1, '전시 라벨 3개 국어 작성', 'exhibition', 5, 8.5, 2, '2025-12-04', 'pending'),
(1, '전시 홍보 SNS 콘텐츠 10개 작성', 'exhibition', 4, 7.2, 1, '2025-12-05', 'pending'),
(2, '교육 프로그램 참가자 모집 공고', 'education', 3, 6.0, 0.5, '2025-12-10', 'pending'),
(3, '연구 논문 초고 작성', 'research', 2, 4.5, 8, '2025-12-20', 'pending');

-- Sample artworks
INSERT INTO artworks (title, artist, year, material, size, description, conservation_status) VALUES
('백자 달항아리', '작자 미상', 1700, '백자', '높이 42cm', '조선시대 대표적인 백자 항아리', 'good'),
('청화백자 매죽문 항아리', '작자 미상', 1750, '청화백자', '높이 35cm', '매화와 대나무 문양의 청화백자', 'needs_attention');

-- Sample budget items
INSERT INTO budget_items (project_id, category, item_name, amount, spent) VALUES
(1, 'exhibition', '전시장 대관료', 5000000, 5000000),
(1, 'exhibition', '홍보물 제작', 2000000, 1500000),
(1, 'exhibition', '작품 운송비', 3000000, 2000000);

-- Default user preferences
INSERT INTO user_preferences (user_id, work_style, preferred_work_hours) VALUES
('default_user', 'sequential', '09:00-18:00');
