/**
 * Museum Solo AI System - API Gateway
 * World-Class Microservices Architecture on Cloudflare Workers
 * 
 * Architecture:
 * - AI Service: Content generation
 * - Priority Service: Task management
 * - Data Service: State management
 * - Workflow Service: Canvas integration
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { HonoContext } from './types';

// Import services
import { createAIService } from '../services/ai-service';
import { createPriorityService } from '../services/priority-service';
import { createDataService } from '../services/data-service';

// Import MCP Servers (Stub for now - will enable after successful build)
// import { GoogleWorkspaceMCP } from '../mcp-servers/google-workspace';
// import { GoogleAIStudioMCP } from '../mcp-servers/google-ai-studio';

const app = new Hono<HonoContext>();

// ============================================
// Middleware
// ============================================

app.use('*', logger());
app.use('/api/*', cors());

// Note: Static files are served by Cloudflare Pages directly from dist/static/
// No need for serveStatic middleware

// ============================================
// Health Check
// ============================================

app.get('/health', (c) => {
  return c.json({
    success: true,
    service: 'Museum Solo AI System',
    version: '1.0.0-alpha',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// API: Projects
// ============================================

app.get('/api/projects', async (c) => {
  try {
    const dataService = createDataService(c.env);
    const projects = await dataService.loadProjects();
    
    return c.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

app.post('/api/projects', async (c) => {
  try {
    const body = await c.req.json();
    const dataService = createDataService(c.env);
    const project = await dataService.saveProject(body);
    
    return c.json({
      success: true,
      data: project,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// ============================================
// API: Tasks
// ============================================

app.get('/api/tasks', async (c) => {
  try {
    const projectId = c.req.query('project_id');
    const dataService = createDataService(c.env);
    const tasks = await dataService.loadTasks(projectId ? parseInt(projectId) : undefined);
    
    return c.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

app.post('/api/tasks', async (c) => {
  try {
    const body = await c.req.json();
    const dataService = createDataService(c.env);
    const task = await dataService.saveTask(body);
    
    return c.json({
      success: true,
      data: task,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// ============================================
// API: Priority Service
// ============================================

app.get('/api/priority/top-tasks', async (c) => {
  try {
    const dataService = createDataService(c.env);
    const priorityService = createPriorityService();
    
    const tasks = await dataService.loadTasks();
    const topTasks = await priorityService.calculateTopPriorityTasks(tasks);
    
    return c.json({
      success: true,
      data: topTasks,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

app.get('/api/priority/daily-schedule', async (c) => {
  try {
    const dataService = createDataService(c.env);
    const priorityService = createPriorityService();
    
    const tasks = await dataService.loadTasks();
    const schedule = await priorityService.generateDailySchedule(tasks);
    
    return c.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// ============================================
// API: Google MCP - Workspace
// ============================================

app.post('/api/google/workspace/create-doc', async (c) => {
  try {
    const body = await c.req.json();
    // const googleMCP = new GoogleWorkspaceMCP({ apiKey: c.env.GOOGLE_API_KEY || '' });
    // const result = await googleMCP.createDocument({ title: body.title, content: body.content });
    
    // Stub response (MCP server coming soon)
    const result = {
      id: 'stub-doc-id',
      title: body.title,
      url: 'https://docs.google.com/document/d/stub',
      createdAt: new Date().toISOString()
    };
    
    return c.json({
      success: true,
      data: result,
      note: 'Stub response - Full MCP integration coming soon'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.post('/api/google/workspace/schedule-event', async (c) => {
  try {
    const body = await c.req.json();
    const result = {
      id: 'stub-event-id',
      title: body.title,
      startTime: body.startTime,
      endTime: body.endTime,
      url: 'https://calendar.google.com/event?stub'
    };
    return c.json({ success: true, data: result, note: 'Stub - MCP coming soon' });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

app.post('/api/google/workspace/send-email', async (c) => {
  try {
    const body = await c.req.json();
    const result = { id: 'stub-email-id', threadId: 'stub-thread', sentAt: new Date().toISOString() };
    return c.json({ success: true, data: result, note: 'Stub - MCP coming soon' });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// ============================================
// API: Google MCP - AI Studio
// ============================================

app.post('/api/google/ai/gemini/generate', async (c) => {
  try {
    const body = await c.req.json();
    const result = { content: `Generated response for: ${body.prompt.substring(0, 50)}...`, usage: { promptTokens: 10, completionTokens: 50, totalTokens: 60 } };
    return c.json({ success: true, data: result, note: 'Stub - Full Gemini 2.0 Flash integration coming soon' });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

app.post('/api/google/ai/gemini/vision', async (c) => {
  try {
    const body = await c.req.json();
    const result = { analysis: 'Image analysis result', detectedObjects: ['object1', 'object2'], colors: ['blue', 'red'], text: 'detected text' };
    return c.json({ success: true, data: result, note: 'Stub - Gemini Vision coming soon' });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

app.post('/api/google/ai/research', async (c) => {
  try {
    const body = await c.req.json();
    const result = { summary: `Research on ${body.topic}`, keyPoints: ['point1', 'point2'], sources: [] };
    return c.json({ success: true, data: result, note: 'Stub - NotebookLM integration coming soon' });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

app.post('/api/google/ai/audio-overview', async (c) => {
  try {
    const body = await c.req.json();
    const result = { script: 'Audio overview script...', duration: body.duration || 5, sections: [] };
    return c.json({ success: true, data: result, note: 'Stub - Audio Overview coming soon' });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

app.post('/api/google/ai/quiz', async (c) => {
  try {
    const body = await c.req.json();
    const result = { title: `Quiz: ${body.topic}`, questions: [{ id: 1, type: 'multiple-choice', question: 'Sample?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: 'explanation', difficulty: 'medium' }] };
    return c.json({ success: true, data: result, note: 'Stub - Quiz Generator coming soon' });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

app.post('/api/google/ai/slides', async (c) => {
  try {
    const body = await c.req.json();
    const result = { title: body.topic, slides: [{ slideNumber: 1, title: 'Slide 1', content: ['bullet 1', 'bullet 2'], notes: 'notes' }] };
    return c.json({ success: true, data: result, note: 'Stub - Slides Generator coming soon' });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

app.post('/api/google/ai/exhibition-label', async (c) => {
  try {
    const body = await c.req.json();
    const result = { labels: { en: { title: body.artworkTitle, description: 'Description...', technicalInfo: body.medium } }, imageAnalysis: 'Analysis...' };
    return c.json({ success: true, data: result, note: 'Stub - Full Gemini Vision + Exhibition Label generation coming soon' });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// ============================================
// API: AI Service (Legacy)
// ============================================

app.post('/api/ai/generate-label', async (c) => {
  try {
    const body = await c.req.json();
    const aiService = createAIService(c.env.OPENAI_API_KEY || '');
    
    const result = await aiService.generateLabel({
      artwork: body.artwork,
      languages: body.languages || ['ko', 'en', 'zh'],
    });
    
    if (!result.success) {
      return c.json(result, 500);
    }
    
    // Save to database
    await c.env.DB.prepare(`
      UPDATE artworks 
      SET label_generated_at = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), body.artwork.id).run();
    
    return c.json(result);
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

app.post('/api/ai/generate-sns', async (c) => {
  try {
    const body = await c.req.json();
    const aiService = createAIService(c.env.OPENAI_API_KEY || '');
    
    const result = await aiService.generateSNS({
      project: body.project,
      platform: body.platform,
    });
    
    return c.json(result);
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

app.post('/api/ai/draft-email', async (c) => {
  try {
    const body = await c.req.json();
    const aiService = createAIService(c.env.OPENAI_API_KEY || '');
    
    const result = await aiService.draftEmail({
      incomingEmail: body.incomingEmail,
      category: body.category,
    });
    
    return c.json(result);
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

app.post('/api/ai/daily-report', async (c) => {
  try {
    const body = await c.req.json();
    const aiService = createAIService(c.env.OPENAI_API_KEY || '');
    
    const result = await aiService.generateDailyReport({
      date: body.date,
      tasks: body.tasks,
      workLogs: body.workLogs,
    });
    
    return c.json(result);
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// ============================================
// API: Real-time Sync (SSE)
// ============================================

app.get('/api/sync/stream', async (c) => {
  const dataService = createDataService(c.env);
  
  const stream = new ReadableStream({
    start(controller) {
      dataService.initSSEStream(controller);
      
      // Send initial connection message
      const message = `data: ${JSON.stringify({
        type: 'connected',
        data: { message: 'Connected to Museum Solo AI System' },
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(message));
      
      // Keep alive ping every 30 seconds
      const interval = setInterval(() => {
        try {
          const ping = `data: ${JSON.stringify({
            type: 'ping',
            data: {},
            timestamp: Date.now(),
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(ping));
        } catch {
          clearInterval(interval);
        }
      }, 30000);
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});

// ============================================
// API: Budget
// ============================================

app.get('/api/budget/summary', async (c) => {
  try {
    const dataService = createDataService(c.env);
    await dataService.updateBudgetSummary();
    const budget = dataService.getValue('budget');
    
    return c.json({
      success: true,
      data: budget,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// ============================================
// API: Analytics
// ============================================

app.get('/api/analytics/summary', async (c) => {
  try {
    const dataService = createDataService(c.env);
    await dataService.updateAnalyticsSummary();
    const analytics = dataService.getValue('analytics');
    
    return c.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// ============================================
// Dashboard (Default Route)
// ============================================

app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Museum Solo AI - Genspark Style</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    body {
      background: #1a1a1a;
      color: #fff;
    }
    .search-box {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
    }
    .icon-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.1);
      transition: all 0.3s;
    }
    .icon-card:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(99,102,241,0.5);
      transform: translateY(-2px);
    }
    .gallery-card {
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s;
    }
    .gallery-card:hover {
      transform: scale(1.02);
      box-shadow: 0 8px 32px rgba(99,102,241,0.3);
    }
  </style>
</head>
<body class="min-h-screen p-4">
  <!-- Header -->
  <div class="max-w-7xl mx-auto">
    <div class="flex items-center justify-between mb-8 pt-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <i class="fas fa-museum text-white text-xl"></i>
        </div>
        <div>
          <h1 class="text-xl font-bold">Museum Solo AI</h1>
          <p class="text-xs text-gray-400">v1.0.0-alpha</p>
        </div>
      </div>
      <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition">
        로그인
      </button>
    </div>

    <!-- AI Search Box (Genspark Style) -->
    <div class="search-box rounded-2xl p-2 mb-8 max-w-4xl mx-auto">
      <div class="flex items-center gap-3 px-4">
        <i class="fas fa-magic text-purple-400"></i>
        <input 
          type="text" 
          placeholder="무엇을 도와드릴까요? 예: '다음 주 전시 라벨 생성해줘', '오늘 우선순위 작업 알려줘'" 
          class="flex-1 bg-transparent border-none outline-none py-4 text-white placeholder-gray-500"
        />
        <button class="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:opacity-90 transition">
          실행
        </button>
      </div>
    </div>

    <!-- Quick Access Icons (Genspark Style Grid) -->
    <div class="mb-8">
      <h2 class="text-sm text-gray-400 mb-4 px-2">빠른 실행</h2>
      <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
        <!-- Row 1 -->
        <a href="/dashboard" class="icon-card p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer">
          <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <i class="fas fa-chart-line text-blue-400 text-xl"></i>
          </div>
          <span class="text-xs text-center">대시보드</span>
        </a>

        <div class="icon-card p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer">
          <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <i class="fas fa-tags text-purple-400 text-xl"></i>
          </div>
          <span class="text-xs text-center">라벨 생성</span>
        </div>

        <div class="icon-card p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer">
          <div class="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
            <i class="fas fa-camera text-pink-400 text-xl"></i>
          </div>
          <span class="text-xs text-center">SNS</span>
        </div>

        <div class="icon-card p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer">
          <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <i class="fas fa-envelope text-green-400 text-xl"></i>
          </div>
          <span class="text-xs text-center">이메일</span>
        </div>

        <div class="icon-card p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer">
          <div class="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <i class="fas fa-file-alt text-yellow-400 text-xl"></i>
          </div>
          <span class="text-xs text-center">문서</span>
        </div>

        <div class="icon-card p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer">
          <div class="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
            <i class="fas fa-calendar text-red-400 text-xl"></i>
          </div>
          <span class="text-xs text-center">일정</span>
        </div>

        <a href="/google-mcp" class="icon-card p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer">
          <div class="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
            <i class="fab fa-google text-teal-400 text-xl"></i>
          </div>
          <span class="text-xs text-center">Google MCP</span>
        </a>

        <div class="icon-card p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer">
          <div class="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <i class="fas fa-search text-indigo-400 text-xl"></i>
          </div>
          <span class="text-xs text-center">리서치</span>
        </div>

        <div class="icon-card p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer">
          <div class="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <i class="fas fa-question-circle text-orange-400 text-xl"></i>
          </div>
          <span class="text-xs text-center">퀴즈</span>
        </div>

        <div class="icon-card p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer">
          <div class="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <i class="fas fa-presentation text-cyan-400 text-xl"></i>
          </div>
          <span class="text-xs text-center">슬라이드</span>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="flex gap-2 mb-6 border-b border-gray-800 pb-2">
      <button class="px-4 py-2 bg-white/10 rounded-t-lg text-sm font-semibold">전체</button>
      <button class="px-4 py-2 text-gray-400 hover:text-white text-sm">최근 작업</button>
      <button class="px-4 py-2 text-gray-400 hover:text-white text-sm">템플릿</button>
      <button class="px-4 py-2 text-gray-400 hover:text-white text-sm">북마크</button>
    </div>

    <!-- Gallery Cards (Genspark Style) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
      <!-- Card 1 -->
      <div class="gallery-card cursor-pointer">
        <div class="h-40 bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
          <i class="fas fa-chart-bar text-6xl text-white/50"></i>
        </div>
        <div class="p-4">
          <div class="text-xs text-gray-400 mb-1">대시보드</div>
          <h3 class="font-semibold mb-2">이번 주 우선순위 작업</h3>
          <p class="text-xs text-gray-400">AI가 분석한 상위 3개 작업</p>
        </div>
      </div>

      <!-- Card 2 -->
      <div class="gallery-card cursor-pointer">
        <div class="h-40 bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
          <i class="fas fa-tag text-6xl text-white/50"></i>
        </div>
        <div class="p-4">
          <div class="text-xs text-gray-400 mb-1">최근 생성</div>
          <h3 class="font-semibold mb-2">현대미술 전시 라벨</h3>
          <p class="text-xs text-gray-400">한/영/중 3개 언어 라벨</p>
        </div>
      </div>

      <!-- Card 3 -->
      <div class="gallery-card cursor-pointer">
        <div class="h-40 bg-gradient-to-br from-green-500/30 to-teal-500/30 flex items-center justify-center">
          <i class="fab fa-google text-6xl text-white/50"></i>
        </div>
        <div class="p-4">
          <div class="text-xs text-gray-400 mb-1">Google MCP</div>
          <h3 class="font-semibold mb-2">Google Workspace 자동화</h3>
          <p class="text-xs text-gray-400">문서, 일정, 이메일 통합</p>
        </div>
      </div>

      <!-- Card 4 -->
      <div class="gallery-card cursor-pointer">
        <div class="h-40 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center">
          <i class="fas fa-book text-6xl text-white/50"></i>
        </div>
        <div class="p-4">
          <div class="text-xs text-gray-400 mb-1">리서치</div>
          <h3 class="font-semibold mb-2">NotebookLM 딥 리서치</h3>
          <p class="text-xs text-gray-400">AI 기반 자료 분석</p>
        </div>
      </div>

      <!-- Card 5 -->
      <div class="gallery-card cursor-pointer">
        <div class="h-40 bg-gradient-to-br from-red-500/30 to-pink-500/30 flex items-center justify-center">
          <i class="fas fa-palette text-6xl text-white/50"></i>
        </div>
        <div class="p-4">
          <div class="text-xs text-gray-400 mb-1">템플릿</div>
          <h3 class="font-semibold mb-2">전시 기획서 템플릿</h3>
          <p class="text-xs text-gray-400">재사용 가능한 문서</p>
        </div>
      </div>

      <!-- Card 6 -->
      <div class="gallery-card cursor-pointer">
        <div class="h-40 bg-gradient-to-br from-indigo-500/30 to-blue-500/30 flex items-center justify-center">
          <i class="fas fa-users text-6xl text-white/50"></i>
        </div>
        <div class="p-4">
          <div class="text-xs text-gray-400 mb-1">교육</div>
          <h3 class="font-semibold mb-2">관람객 교육 퀴즈</h3>
          <p class="text-xs text-gray-400">AI 생성 교육 콘텐츠</p>
        </div>
      </div>

      <!-- Card 7 -->
      <div class="gallery-card cursor-pointer">
        <div class="h-40 bg-gradient-to-br from-cyan-500/30 to-teal-500/30 flex items-center justify-center">
          <i class="fas fa-presentation text-6xl text-white/50"></i>
        </div>
        <div class="p-4">
          <div class="text-xs text-gray-400 mb-1">프레젠테이션</div>
          <h3 class="font-semibold mb-2">전시 소개 슬라이드</h3>
          <p class="text-xs text-gray-400">AI 자동 생성</p>
        </div>
      </div>

      <!-- Card 8 -->
      <div class="gallery-card cursor-pointer">
        <div class="h-40 bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center">
          <i class="fas fa-camera text-6xl text-white/50"></i>
        </div>
        <div class="p-4">
          <div class="text-xs text-gray-400 mb-1">SNS</div>
          <h3 class="font-semibold mb-2">Instagram 포스트</h3>
          <p class="text-xs text-gray-400">자동 생성된 콘텐츠</p>
        </div>
      </div>
    </div>

    <!-- Stats Banner -->
    <div class="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-8 border border-purple-500/30">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div>
          <div class="text-4xl font-bold text-green-400 mb-2">-50%</div>
          <div class="text-sm text-gray-300">월간 작업 시간 감소</div>
          <div class="text-xs text-gray-500 mt-1">262.5h → 130h</div>
        </div>
        <div>
          <div class="text-4xl font-bold text-blue-400 mb-2">-87%</div>
          <div class="text-sm text-gray-300">라벨 생성 시간 단축</div>
          <div class="text-xs text-gray-500 mt-1">2h → 5min</div>
        </div>
        <div>
          <div class="text-4xl font-bold text-purple-400 mb-2">+42%</div>
          <div class="text-sm text-gray-300">작업 완료율 향상</div>
          <div class="text-xs text-gray-500 mt-1">65% → 92%</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Search functionality
    document.querySelector('input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value;
        alert('AI 프롬프트 실행: ' + query);
        // TODO: Integrate with AI service
      }
    });
  </script>
</body>
</html>
`);
});

export default app;
