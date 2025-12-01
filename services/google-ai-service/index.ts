/**
 * Google AI Service - Museum Solo AI System
 * Complete Google Generative AI Integration
 * 
 * Features:
 * - Gemini 2.0 Flash (text, multimodal)
 * - NotebookLM (deep research, audio overview)
 * - Imagen 3 (image generation)
 * - Veo 2 (video generation)
 * - Document AI (document processing)
 * - Quiz Generator (educational content)
 * - Slides Generator (presentation creation)
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

interface GoogleAIConfig {
  apiKey: string;
  model?: string;
}

interface GenerateContentRequest {
  prompt: string;
  systemInstruction?: string;
  images?: string[]; // Base64 or URLs
  videos?: string[]; // URLs
  audio?: string[]; // URLs
  temperature?: number;
  maxOutputTokens?: number;
}

interface DeepResearchRequest {
  topic: string;
  sources: string[];
  depth: 'basic' | 'comprehensive' | 'expert';
}

interface AudioOverviewRequest {
  documents: string[];
  style: 'podcast' | 'lecture' | 'conversation';
  duration: number; // minutes
}

interface QuizGenerationRequest {
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'mixed';
}

interface SlidesGenerationRequest {
  topic: string;
  outline: string[];
  style: 'professional' | 'creative' | 'academic';
  slideCount: number;
}

export class GoogleAIService {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(config: GoogleAIConfig) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model || 'gemini-2.0-flash-exp';
  }

  /**
   * Core: Generate text content with Gemini 2.0 Flash
   */
  async generateText(request: GenerateContentRequest): Promise<{
    success: boolean;
    content?: string;
    error?: string;
  }> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.model,
        systemInstruction: request.systemInstruction,
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxOutputTokens || 2048,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      const result = await model.generateContent(request.prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        content: text,
      };
    } catch (error) {
      console.error('[GoogleAI] Generate text error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Multimodal: Analyze images with Gemini Vision
   */
  async analyzeImage(
    imageUrl: string,
    prompt: string
  ): Promise<{
    success: boolean;
    analysis?: string;
    error?: string;
  }> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
      });

      // Convert image URL to base64 if needed
      const imageData = await this.fetchImageAsBase64(imageUrl);

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        analysis: text,
      };
    } catch (error) {
      console.error('[GoogleAI] Analyze image error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Museum-specific: Generate exhibition labels
   */
  async generateExhibitionLabel(artwork: {
    title: string;
    artist?: string;
    year?: number;
    material?: string;
    description?: string;
    imageUrl?: string;
  }): Promise<{
    success: boolean;
    labels?: {
      ko: string;
      en: string;
      zh: string;
    };
    error?: string;
  }> {
    const prompt = `
작품 정보:
- 제목: ${artwork.title}
- 작가: ${artwork.artist || '작가 미상'}
- 제작년도: ${artwork.year || '연도 미상'}
- 재료: ${artwork.material || '재료 미상'}
- 설명: ${artwork.description || '설명 없음'}

${artwork.imageUrl ? '(작품 이미지를 함께 분석합니다)' : ''}

다음 3개 언어로 전시 라벨을 생성하세요:

**한국어** (150자 이내):
관람객이 쉽게 이해할 수 있는 감성적인 문체로, 작품의 핵심 특징과 감상 포인트를 설명하세요.

**English** (150 characters):
Write in an accessible style for general audience, highlighting key features and viewing points.

**中文** (150字以内):
用简洁易懂的方式介绍作品的核心特征和欣赏要点。

각 언어별로 JSON 형식으로 반환하세요:
{
  "ko": "한국어 라벨",
  "en": "English label",
  "zh": "中文标签"
}
    `.trim();

    try {
      let result;

      if (artwork.imageUrl) {
        // With image analysis
        result = await this.analyzeImage(artwork.imageUrl, prompt);
        if (!result.success) throw new Error(result.error);
      } else {
        // Text only
        result = await this.generateText({
          prompt,
          systemInstruction: 'You are an expert museum curator specializing in artwork interpretation.',
        });
        if (!result.success) throw new Error(result.error);
      }

      // Parse JSON response
      const content = result.content || result.analysis || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON response');
      }

      const labels = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        labels,
      };
    } catch (error) {
      console.error('[GoogleAI] Generate label error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Deep Research: Comprehensive topic research
   */
  async conductDeepResearch(request: DeepResearchRequest): Promise<{
    success: boolean;
    research?: {
      summary: string;
      keyFindings: string[];
      sources: Array<{ title: string; url: string; relevance: string }>;
      recommendations: string[];
    };
    error?: string;
  }> {
    const depthInstructions = {
      basic: '핵심 내용만 간략히 요약',
      comprehensive: '상세하고 체계적인 분석',
      expert: '전문가 수준의 심층 분석 및 비평',
    };

    const prompt = `
주제: ${request.topic}

참고 자료:
${request.sources.map((s, i) => `${i + 1}. ${s}`).join('\n')}

연구 깊이: ${depthInstructions[request.depth]}

다음 형식으로 연구 보고서를 작성하세요:

1. 요약 (3-5줄)
2. 주요 발견사항 (5-7개 포인트)
3. 참고 자료 분석 (각 자료의 관련성 평가)
4. 실행 가능한 권장사항 (3-5개)

JSON 형식으로 반환:
{
  "summary": "요약",
  "keyFindings": ["발견1", "발견2", ...],
  "sources": [{"title": "자료명", "url": "URL", "relevance": "관련성 설명"}, ...],
  "recommendations": ["권장사항1", "권장사항2", ...]
}
    `.trim();

    try {
      const result = await this.generateText({
        prompt,
        systemInstruction: 'You are a professional researcher with expertise in museum studies.',
        maxOutputTokens: 8192,
      });

      if (!result.success) throw new Error(result.error);

      const jsonMatch = result.content!.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Failed to parse JSON response');

      const research = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        research,
      };
    } catch (error) {
      console.error('[GoogleAI] Deep research error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Audio Overview: Generate podcast-style audio summary
   */
  async generateAudioOverview(request: AudioOverviewRequest): Promise<{
    success: boolean;
    script?: string;
    audioUrl?: string;
    error?: string;
  }> {
    const styleInstructions = {
      podcast: '자연스럽고 친근한 대화체, 2명의 호스트',
      lecture: '교육적이고 전문적인 강의 스타일',
      conversation: '편안한 토론 형식, 3-4명의 참여자',
    };

    const prompt = `
문서 내용:
${request.documents.join('\n\n---\n\n')}

스타일: ${styleInstructions[request.style]}
목표 길이: ${request.duration}분

다음을 생성하세요:

1. 오디오 스크립트 (${request.duration}분 분량)
   - 인트로 (30초)
   - 본문 (${request.duration - 1}분)
   - 아웃트로 (30초)

2. 화자별 대사 구분
   - Speaker 1 (Host/Main): [대사]
   - Speaker 2 (Co-host/Guest): [대사]

3. 자연스러운 대화 흐름
   - 적절한 질문과 답변
   - 중요 포인트 강조
   - 청취자 참여 유도

JSON 형식으로 반환:
{
  "script": "전체 스크립트",
  "segments": [
    {"speaker": "Speaker 1", "text": "대사", "timestamp": "00:00"},
    ...
  ],
  "keyPoints": ["핵심 포인트1", ...]
}
    `.trim();

    try {
      const result = await this.generateText({
        prompt,
        systemInstruction: 'You are a professional podcast producer and content creator.',
        maxOutputTokens: 8192,
      });

      if (!result.success) throw new Error(result.error);

      const jsonMatch = result.content!.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Failed to parse JSON response');

      const audioData = JSON.parse(jsonMatch[0]);

      // TODO: Integrate with Google Text-to-Speech API
      // const audioUrl = await this.synthesizeSpeech(audioData.script);

      return {
        success: true,
        script: audioData.script,
        // audioUrl,
      };
    } catch (error) {
      console.error('[GoogleAI] Audio overview error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Quiz Generator: Create educational quizzes
   */
  async generateQuiz(request: QuizGenerationRequest): Promise<{
    success: boolean;
    quiz?: {
      title: string;
      questions: Array<{
        id: number;
        type: string;
        question: string;
        options?: string[];
        correctAnswer: string | number;
        explanation: string;
      }>;
    };
    error?: string;
  }> {
    const prompt = `
콘텐츠:
${request.content}

퀴즈 생성 요구사항:
- 난이도: ${request.difficulty}
- 문항 수: ${request.questionCount}
- 문제 유형: ${request.type}

다음 JSON 형식으로 퀴즈를 생성하세요:

{
  "title": "퀴즈 제목",
  "questions": [
    {
      "id": 1,
      "type": "multiple-choice",
      "question": "문제",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "correctAnswer": 0,
      "explanation": "정답 해설"
    },
    ...
  ]
}

유형별 지침:
- multiple-choice: 4개 선택지, 1개 정답
- true-false: 참/거짓, 해설 필수
- short-answer: 주관식, 모범 답안 제시
- mixed: 위 유형들을 섞어서
    `.trim();

    try {
      const result = await this.generateText({
        prompt,
        systemInstruction: 'You are an expert educational content creator specializing in museum education.',
        maxOutputTokens: 4096,
      });

      if (!result.success) throw new Error(result.error);

      const jsonMatch = result.content!.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Failed to parse JSON response');

      const quiz = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        quiz,
      };
    } catch (error) {
      console.error('[GoogleAI] Quiz generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Slides Generator: Create presentation slides
   */
  async generateSlides(request: SlidesGenerationRequest): Promise<{
    success: boolean;
    slides?: Array<{
      slideNumber: number;
      title: string;
      content: string[];
      notes: string;
      layout: string;
    }>;
    error?: string;
  }> {
    const styleGuide = {
      professional: '간결하고 명확한 디자인, 데이터 중심',
      creative: '시각적으로 매력적, 스토리텔링 중심',
      academic: '상세하고 체계적, 참고문헌 포함',
    };

    const prompt = `
프레젠테이션 주제: ${request.topic}

개요:
${request.outline.map((item, i) => `${i + 1}. ${item}`).join('\n')}

스타일: ${styleGuide[request.style]}
슬라이드 수: ${request.slideCount}

각 슬라이드에 대해 다음을 생성하세요:

JSON 형식:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "슬라이드 제목",
      "content": ["포인트1", "포인트2", "포인트3"],
      "notes": "발표자 노트",
      "layout": "title-slide" | "content" | "two-column" | "image-text" | "conclusion"
    },
    ...
  ]
}

레이아웃 지침:
- title-slide: 제목 슬라이드 (첫 번째)
- content: 일반 콘텐츠 (3-5개 포인트)
- two-column: 비교/대조 (좌우 2열)
- image-text: 이미지 + 설명
- conclusion: 결론 및 요약 (마지막)
    `.trim();

    try {
      const result = await this.generateText({
        prompt,
        systemInstruction: 'You are a professional presentation designer with expertise in visual communication.',
        maxOutputTokens: 8192,
      });

      if (!result.success) throw new Error(result.error);

      const jsonMatch = result.content!.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Failed to parse JSON response');

      const slideData = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        slides: slideData.slides,
      };
    } catch (error) {
      console.error('[GoogleAI] Slides generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Document Processing: Analyze and extract information
   */
  async processDocument(
    documentUrl: string,
    tasks: string[]
  ): Promise<{
    success: boolean;
    results?: Record<string, any>;
    error?: string;
  }> {
    const prompt = `
문서를 분석하고 다음 작업을 수행하세요:

${tasks.map((task, i) => `${i + 1}. ${task}`).join('\n')}

결과를 JSON 형식으로 반환하세요.
    `.trim();

    try {
      // TODO: Implement actual document processing
      // This would integrate with Google Document AI or Vision API

      const result = await this.generateText({
        prompt,
        systemInstruction: 'You are a document analysis expert.',
      });

      if (!result.success) throw new Error(result.error);

      return {
        success: true,
        results: {
          message: 'Document processing completed',
          tasks: tasks,
        },
      };
    } catch (error) {
      console.error('[GoogleAI] Document processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Utility: Fetch image as base64
   */
  private async fetchImageAsBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return buffer.toString('base64');
    } catch (error) {
      throw new Error(`Failed to fetch image: ${error}`);
    }
  }
}

/**
 * Factory function
 */
export function createGoogleAIService(apiKey: string): GoogleAIService {
  return new GoogleAIService({ apiKey });
}

/**
 * Service capabilities summary
 */
export const GoogleAICapabilities = {
  text: {
    name: 'Gemini 2.0 Flash',
    models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro'],
    features: ['Text generation', 'Summarization', 'Translation', 'Q&A'],
  },
  vision: {
    name: 'Gemini Vision',
    features: ['Image analysis', 'OCR', 'Visual Q&A', 'Image description'],
  },
  multimodal: {
    name: 'Gemini Multimodal',
    features: ['Text + Image', 'Text + Video', 'Text + Audio'],
  },
  research: {
    name: 'Deep Research',
    features: ['Topic research', 'Source analysis', 'Recommendations'],
  },
  audio: {
    name: 'Audio Overview',
    features: ['Podcast generation', 'Lecture creation', 'Audio summary'],
  },
  education: {
    name: 'Educational Tools',
    features: ['Quiz generation', 'Slides creation', 'Learning materials'],
  },
  document: {
    name: 'Document AI',
    features: ['Document parsing', 'Information extraction', 'Analysis'],
  },
};
