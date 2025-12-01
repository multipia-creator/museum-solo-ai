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
import { serveStatic } from 'hono/cloudflare-workers';
import type { HonoContext } from './types';

// Import services
import { createAIService } from '../services/ai-service';
import { createPriorityService } from '../services/priority-service';
import { createDataService } from '../services/data-service';

const app = new Hono<HonoContext>();

// ============================================
// Middleware
// ============================================

app.use('*', logger());
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

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
// API: AI Service
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
  return c.html(`
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Museum Solo AI System</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen text-white">
  <div class="container mx-auto px-4 py-12">
    <div class="text-center mb-12">
      <h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        <i class="fas fa-robot mr-3"></i>
        Museum Solo AI System
      </h1>
      <p class="text-xl text-gray-300">
        AI-Powered Workflow Automation for Solo Museum Curators
      </p>
      <p class="text-sm text-gray-400 mt-2">
        Version 1.0.0-alpha | MSA Architecture
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      <div class="bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10">
        <div class="text-4xl mb-3">🤖</div>
        <h3 class="text-lg font-semibold mb-2">AI Service</h3>
        <p class="text-sm text-gray-400">Label, SNS, Email automation</p>
      </div>
      
      <div class="bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10">
        <div class="text-4xl mb-3">🎯</div>
        <h3 class="text-lg font-semibold mb-2">Priority Service</h3>
        <p class="text-sm text-gray-400">Smart task prioritization</p>
      </div>
      
      <div class="bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10">
        <div class="text-4xl mb-3">💾</div>
        <h3 class="text-lg font-semibold mb-2">Data Service</h3>
        <p class="text-sm text-gray-400">Real-time state sync</p>
      </div>
      
      <div class="bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10">
        <div class="text-4xl mb-3">🔄</div>
        <h3 class="text-lg font-semibold mb-2">Workflow Service</h3>
        <p class="text-sm text-gray-400">Canvas integration</p>
      </div>
    </div>

    <div class="bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/10">
      <h2 class="text-2xl font-bold mb-6">
        <i class="fas fa-chart-line mr-2"></i>
        Expected Impact
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="text-center">
          <div class="text-3xl font-bold text-green-400 mb-2">-50%</div>
          <div class="text-sm text-gray-400">Monthly Hours</div>
          <div class="text-xs text-gray-500 mt-1">262.5h → 130h</div>
        </div>
        
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-400 mb-2">-87%</div>
          <div class="text-sm text-gray-400">Label Creation</div>
          <div class="text-xs text-gray-500 mt-1">2h → 5min</div>
        </div>
        
        <div class="text-center">
          <div class="text-3xl font-bold text-purple-400 mb-2">-80%</div>
          <div class="text-sm text-gray-400">Time to Action</div>
          <div class="text-xs text-gray-500 mt-1">10s → 2s</div>
        </div>
      </div>
    </div>

    <div class="mt-8 text-center text-sm text-gray-400">
      <p>Built with ❤️ for Solo Museum Curators</p>
      <p class="mt-2">Powered by Cloudflare Workers | Hono | OpenAI GPT-4</p>
    </div>
  </div>
</body>
</html>
  `);
});

export default app;
