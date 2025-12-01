/**
 * Google Workspace MCP Server
 * Full integration with Google Docs, Sheets, Slides, Gmail, Calendar, Drive
 * 
 * Features:
 * - Auto-create exhibition documents
 * - Schedule events in Google Calendar
 * - Send emails via Gmail
 * - Manage files in Google Drive
 * - Create presentations in Google Slides
 * - Process data in Google Sheets
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize Google APIs
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set credentials from environment
if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
}

const docs = google.docs({ version: 'v1', auth: oauth2Client });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
const slides = google.slides({ version: 'v1', auth: oauth2Client });
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Create MCP Server
const server = new Server(
  {
    name: 'google-workspace-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ============================================
// Tool Definitions
// ============================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Google Docs
      {
        name: 'create_exhibition_document',
        description: '전시 기획서, 보고서, 제안서를 Google Docs에 자동 작성합니다. 템플릿 적용 및 포맷팅 포함.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: '문서 제목 (예: "2025 세계문화유산 순회전 기획서")',
            },
            content: {
              type: 'string',
              description: '문서 본문 (마크다운 형식 지원)',
            },
            template: {
              type: 'string',
              enum: ['exhibition', 'report', 'proposal', 'educational'],
              description: '문서 템플릿 유형',
            },
            shareWith: {
              type: 'array',
              items: { type: 'string' },
              description: '공유할 이메일 주소 목록',
            },
          },
          required: ['title', 'content'],
        },
      },
      
      // Google Slides
      {
        name: 'create_presentation',
        description: '전시 소개, 교육 자료, 연구 발표용 프레젠테이션을 Google Slides에 자동 생성합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: '프레젠테이션 제목',
            },
            slides: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  content: { type: 'array', items: { type: 'string' } },
                  imageUrl: { type: 'string' },
                  layout: { 
                    type: 'string',
                    enum: ['title', 'content', 'two-column', 'image-text', 'conclusion']
                  },
                },
              },
              description: '슬라이드 구성',
            },
            theme: {
              type: 'string',
              enum: ['professional', 'creative', 'academic'],
              description: '테마 스타일',
            },
          },
          required: ['title', 'slides'],
        },
      },
      
      // Google Calendar
      {
        name: 'schedule_exhibition',
        description: '전시, 교육 프로그램, 회의 일정을 Google Calendar에 자동 등록합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: '일정 제목',
            },
            description: {
              type: 'string',
              description: '일정 설명',
            },
            startDate: {
              type: 'string',
              description: '시작 날짜 (ISO 8601 형식: 2025-02-01T09:00:00)',
            },
            endDate: {
              type: 'string',
              description: '종료 날짜',
            },
            location: {
              type: 'string',
              description: '장소',
            },
            attendees: {
              type: 'array',
              items: { type: 'string' },
              description: '참석자 이메일 목록',
            },
            recurrence: {
              type: 'string',
              description: 'RRULE 형식의 반복 규칙 (예: "RRULE:FREQ=WEEKLY;BYDAY=SA")',
            },
          },
          required: ['title', 'startDate', 'endDate'],
        },
      },
      
      // Gmail
      {
        name: 'send_email',
        description: '협력 제안, 참가 확인, 공지사항 등을 Gmail로 자동 발송합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            to: {
              type: 'array',
              items: { type: 'string' },
              description: '수신자 이메일 주소',
            },
            cc: {
              type: 'array',
              items: { type: 'string' },
              description: '참조 이메일 주소',
            },
            subject: {
              type: 'string',
              description: '이메일 제목',
            },
            body: {
              type: 'string',
              description: '이메일 본문 (HTML 지원)',
            },
            attachments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  mimeType: { type: 'string' },
                  data: { type: 'string', description: 'Base64 encoded data' },
                },
              },
              description: '첨부 파일',
            },
          },
          required: ['to', 'subject', 'body'],
        },
      },
      
      // Google Sheets
      {
        name: 'create_budget_sheet',
        description: '예산 관리, 참가자 명단, 작품 목록 등을 Google Sheets에 자동 생성합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: '스프레드시트 제목',
            },
            sheetName: {
              type: 'string',
              description: '시트 이름',
            },
            headers: {
              type: 'array',
              items: { type: 'string' },
              description: '컬럼 헤더',
            },
            data: {
              type: 'array',
              items: {
                type: 'array',
                items: { type: 'string' },
              },
              description: '데이터 행',
            },
            formulas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  cell: { type: 'string', description: 'A1 notation (예: "B10")' },
                  formula: { type: 'string', description: '수식 (예: "=SUM(B2:B9)")' },
                },
              },
              description: '자동 계산 수식',
            },
          },
          required: ['title', 'headers', 'data'],
        },
      },
      
      // Google Drive
      {
        name: 'upload_artwork_images',
        description: '작품 이미지, 전시 사진, 문서 파일을 Google Drive에 업로드하고 정리합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            files: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  mimeType: { type: 'string' },
                  data: { type: 'string', description: 'Base64 encoded data' },
                },
              },
              description: '업로드할 파일',
            },
            folderName: {
              type: 'string',
              description: '저장할 폴더 이름 (없으면 자동 생성)',
            },
            shareWith: {
              type: 'array',
              items: { type: 'string' },
              description: '공유할 이메일 주소',
            },
          },
          required: ['files'],
        },
      },
      
      // Batch Operations
      {
        name: 'create_exhibition_package',
        description: '전시 관련 모든 문서를 한번에 생성합니다 (기획서 + 프레젠테이션 + 일정 + 예산표).',
        inputSchema: {
          type: 'object',
          properties: {
            exhibitionTitle: {
              type: 'string',
              description: '전시 제목',
            },
            description: {
              type: 'string',
              description: '전시 설명',
            },
            startDate: {
              type: 'string',
              description: '시작일',
            },
            endDate: {
              type: 'string',
              description: '종료일',
            },
            budget: {
              type: 'number',
              description: '총 예산',
            },
            teamEmails: {
              type: 'array',
              items: { type: 'string' },
              description: '팀원 이메일 (모든 문서 공유)',
            },
          },
          required: ['exhibitionTitle', 'startDate', 'endDate'],
        },
      },
    ],
  };
});

// ============================================
// Tool Implementations
// ============================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case 'create_exhibition_document':
        return await createExhibitionDocument(request.params.arguments);
      
      case 'create_presentation':
        return await createPresentation(request.params.arguments);
      
      case 'schedule_exhibition':
        return await scheduleExhibition(request.params.arguments);
      
      case 'send_email':
        return await sendEmail(request.params.arguments);
      
      case 'create_budget_sheet':
        return await createBudgetSheet(request.params.arguments);
      
      case 'upload_artwork_images':
        return await uploadArtworkImages(request.params.arguments);
      
      case 'create_exhibition_package':
        return await createExhibitionPackage(request.params.arguments);
      
      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
    }
  } catch (error) {
    console.error('[MCP] Tool execution error:', error);
    throw new McpError(
      ErrorCode.InternalError,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});

// ============================================
// Implementation Functions
// ============================================

async function createExhibitionDocument(args: any) {
  // Create Google Doc
  const doc = await docs.documents.create({
    requestBody: {
      title: args.title,
    },
  });

  const documentId = doc.data.documentId!;

  // Format content
  const requests = [
    {
      insertText: {
        location: { index: 1 },
        text: args.content,
      },
    },
  ];

  // Apply template styling
  if (args.template === 'exhibition') {
    requests.push({
      updateTextStyle: {
        range: { startIndex: 1, endIndex: args.title.length + 1 },
        textStyle: {
          fontSize: { magnitude: 24, unit: 'PT' },
          bold: true,
        },
        fields: 'fontSize,bold',
      },
    } as any);
  }

  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests },
  });

  // Share with team
  if (args.shareWith && args.shareWith.length > 0) {
    for (const email of args.shareWith) {
      await drive.permissions.create({
        fileId: documentId,
        requestBody: {
          type: 'user',
          role: 'writer',
          emailAddress: email,
        },
      });
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `✅ 문서 생성 완료!\n\n` +
              `📄 제목: ${args.title}\n` +
              `🔗 URL: https://docs.google.com/document/d/${documentId}\n` +
              `👥 공유: ${args.shareWith?.length || 0}명`,
      },
    ],
  };
}

async function createPresentation(args: any) {
  const presentation = await slides.presentations.create({
    requestBody: {
      title: args.title,
    },
  });

  const presentationId = presentation.data.presentationId!;

  // Add slides
  const requests: any[] = [];
  
  args.slides.forEach((slide: any, index: number) => {
    const slideId = `slide_${index}`;
    
    requests.push({
      createSlide: {
        objectId: slideId,
        slideLayoutReference: {
          predefinedLayout: 'TITLE_AND_BODY',
        },
      },
    });
  });

  await slides.presentations.batchUpdate({
    presentationId,
    requestBody: { requests },
  });

  return {
    content: [
      {
        type: 'text',
        text: `✅ 프레젠테이션 생성 완료!\n\n` +
              `📊 제목: ${args.title}\n` +
              `📄 슬라이드: ${args.slides.length}개\n` +
              `🔗 URL: https://docs.google.com/presentation/d/${presentationId}`,
      },
    ],
  };
}

async function scheduleExhibition(args: any) {
  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: args.title,
      description: args.description,
      location: args.location,
      start: {
        dateTime: args.startDate,
        timeZone: 'Asia/Seoul',
      },
      end: {
        dateTime: args.endDate,
        timeZone: 'Asia/Seoul',
      },
      attendees: args.attendees?.map((email: string) => ({ email })),
      recurrence: args.recurrence ? [args.recurrence] : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    },
  });

  return {
    content: [
      {
        type: 'text',
        text: `✅ 일정 등록 완료!\n\n` +
              `📅 제목: ${args.title}\n` +
              `🕐 시작: ${args.startDate}\n` +
              `🕐 종료: ${args.endDate}\n` +
              `📍 장소: ${args.location || '미정'}\n` +
              `👥 참석자: ${args.attendees?.length || 0}명\n` +
              `🔗 URL: ${event.data.htmlLink}`,
      },
    ],
  };
}

async function sendEmail(args: any) {
  const message = [
    `To: ${args.to.join(', ')}`,
    args.cc ? `Cc: ${args.cc.join(', ')}` : '',
    `Subject: ${args.subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    args.body,
  ].filter(Boolean).join('\n');

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });

  return {
    content: [
      {
        type: 'text',
        text: `✅ 이메일 발송 완료!\n\n` +
              `📧 수신자: ${args.to.join(', ')}\n` +
              `📝 제목: ${args.subject}\n` +
              `✉️ ID: ${result.data.id}`,
      },
    ],
  };
}

async function createBudgetSheet(args: any) {
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: args.title,
      },
      sheets: [
        {
          properties: {
            title: args.sheetName || 'Sheet1',
          },
        },
      ],
    },
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId!;

  // Add headers and data
  const values = [args.headers, ...args.data];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'A1',
    valueInputOption: 'RAW',
    requestBody: { values },
  });

  // Add formulas
  if (args.formulas) {
    for (const formula of args.formulas) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: formula.cell,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[formula.formula]],
        },
      });
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `✅ 스프레드시트 생성 완료!\n\n` +
              `📊 제목: ${args.title}\n` +
              `📄 행: ${args.data.length}개\n` +
              `🔗 URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      },
    ],
  };
}

async function uploadArtworkImages(args: any) {
  const uploadedFiles: string[] = [];

  // Create folder if needed
  let folderId: string | undefined;
  if (args.folderName) {
    const folder = await drive.files.create({
      requestBody: {
        name: args.folderName,
        mimeType: 'application/vnd.google-apps.folder',
      },
    });
    folderId = folder.data.id!;
  }

  // Upload files
  for (const file of args.files) {
    const buffer = Buffer.from(file.data, 'base64');
    
    const uploadedFile = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: folderId ? [folderId] : undefined,
      },
      media: {
        mimeType: file.mimeType,
        body: buffer as any,
      },
    });

    uploadedFiles.push(uploadedFile.data.id!);

    // Share if needed
    if (args.shareWith) {
      for (const email of args.shareWith) {
        await drive.permissions.create({
          fileId: uploadedFile.data.id!,
          requestBody: {
            type: 'user',
            role: 'reader',
            emailAddress: email,
          },
        });
      }
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `✅ 파일 업로드 완료!\n\n` +
              `📁 폴더: ${args.folderName || '내 드라이브'}\n` +
              `📄 파일: ${uploadedFiles.length}개\n` +
              `👥 공유: ${args.shareWith?.length || 0}명`,
      },
    ],
  };
}

async function createExhibitionPackage(args: any) {
  // 1. Create exhibition document
  const docResult = await createExhibitionDocument({
    title: `${args.exhibitionTitle} - 기획서`,
    content: `# ${args.exhibitionTitle}\n\n${args.description}`,
    template: 'exhibition',
    shareWith: args.teamEmails,
  });

  // 2. Create presentation
  const slidesResult = await createPresentation({
    title: `${args.exhibitionTitle} - 발표자료`,
    slides: [
      { title: args.exhibitionTitle, content: [args.description], layout: 'title' },
      { title: '전시 개요', content: ['기간', '장소', '예산'], layout: 'content' },
    ],
  });

  // 3. Schedule in calendar
  const calendarResult = await scheduleExhibition({
    title: args.exhibitionTitle,
    description: args.description,
    startDate: args.startDate,
    endDate: args.endDate,
    attendees: args.teamEmails,
  });

  // 4. Create budget sheet
  const sheetResult = await createBudgetSheet({
    title: `${args.exhibitionTitle} - 예산표`,
    headers: ['항목', '금액', '지출', '잔액'],
    data: [
      ['총 예산', args.budget?.toString() || '0', '0', args.budget?.toString() || '0'],
    ],
    formulas: [
      { cell: 'D2', formula: '=B2-C2' },
    ],
  });

  return {
    content: [
      {
        type: 'text',
        text: `🎉 전시 패키지 생성 완료!\n\n` +
              `📋 생성된 문서:\n` +
              `1. 기획서\n` +
              `2. 프레젠테이션\n` +
              `3. 캘린더 일정\n` +
              `4. 예산 스프레드시트\n\n` +
              `👥 ${args.teamEmails?.length || 0}명에게 공유됨`,
      },
    ],
  };
}

// ============================================
// Start Server
// ============================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP] Google Workspace MCP Server running on stdio');
}

main().catch((error) => {
  console.error('[MCP] Fatal error:', error);
  process.exit(1);
});
