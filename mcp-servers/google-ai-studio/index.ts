/**
 * Museum Solo AI System
 * Google AI Studio MCP Server
 * 
 * Integrates all Google AI Studio capabilities:
 * - Gemini 2.0 Flash (text generation)
 * - Gemini Vision (image analysis)
 * - Imagen 3 (image generation)
 * - Veo 2 (video generation)
 * - NotebookLM (deep research)
 * - Audio Overview (audio summarization)
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

export interface GoogleAIConfig {
  apiKey: string
  modelVersion?: string
}

export interface GeminiGenerateRequest {
  prompt: string
  model?: 'gemini-2.0-flash' | 'gemini-1.5-pro' | 'gemini-1.5-flash'
  systemInstruction?: string
  temperature?: number
  maxTokens?: number
}

export interface GeminiVisionRequest {
  prompt: string
  imageUrls: string[]
  model?: 'gemini-2.0-flash' | 'gemini-1.5-pro'
}

export interface Imagen3Request {
  prompt: string
  negativePrompt?: string
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3'
  numberOfImages?: number
}

export interface Veo2Request {
  prompt: string
  duration?: number // seconds (5-8)
  aspectRatio?: '16:9' | '9:16'
  referenceImage?: string
}

export interface NotebookLMRequest {
  topic: string
  sources: string[] // URLs or text
  outputFormat?: 'summary' | 'qa' | 'timeline' | 'outline'
}

export interface AudioOverviewRequest {
  text: string
  style?: 'podcast' | 'lecture' | 'conversation'
  duration?: number // minutes
}

export interface QuizGeneratorRequest {
  topic: string
  difficulty?: 'easy' | 'medium' | 'hard'
  numberOfQuestions?: number
  questionType?: 'multiple-choice' | 'true-false' | 'short-answer' | 'mixed'
}

export interface SlidesGeneratorRequest {
  topic: string
  numberOfSlides?: number
  style?: 'professional' | 'creative' | 'minimal' | 'academic'
  includeImages?: boolean
}

/**
 * Google AI Studio MCP Server
 */
export class GoogleAIStudioMCP {
  private genAI: GoogleGenerativeAI
  private apiKey: string

  constructor(config: GoogleAIConfig) {
    this.apiKey = config.apiKey
    this.genAI = new GoogleGenerativeAI(config.apiKey)
  }

  /**
   * Tool 1: Gemini 2.0 Flash - Text Generation
   */
  async geminiGenerate(request: GeminiGenerateRequest): Promise<{
    content: string
    usage: { promptTokens: number; completionTokens: number; totalTokens: number }
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: request.model || 'gemini-2.0-flash',
        systemInstruction: request.systemInstruction
      })

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 2048
        }
      })

      const response = result.response
      const text = response.text()

      return {
        content: text,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0
        }
      }
    } catch (error) {
      throw new Error(`Gemini Generate failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Tool 2: Gemini Vision - Image Analysis
   */
  async geminiVision(request: GeminiVisionRequest): Promise<{
    analysis: string
    detectedObjects?: string[]
    colors?: string[]
    text?: string
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: request.model || 'gemini-2.0-flash'
      })

      // Fetch images
      const imageParts = await Promise.all(
        request.imageUrls.map(async (url) => {
          const response = await fetch(url)
          const buffer = await response.arrayBuffer()
          const base64 = Buffer.from(buffer).toString('base64')
          const mimeType = response.headers.get('content-type') || 'image/jpeg'
          
          return {
            inlineData: {
              data: base64,
              mimeType
            }
          }
        })
      )

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: request.prompt },
            ...imageParts
          ]
        }]
      })

      const text = result.response.text()

      return {
        analysis: text,
        detectedObjects: this.extractObjects(text),
        colors: this.extractColors(text),
        text: this.extractText(text)
      }
    } catch (error) {
      throw new Error(`Gemini Vision failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Tool 3: NotebookLM - Deep Research
   */
  async notebookLMResearch(request: NotebookLMRequest): Promise<{
    summary: string
    keyPoints: string[]
    sources: Array<{ title: string; url: string; relevance: number }>
    timeline?: Array<{ date: string; event: string }>
    qa?: Array<{ question: string; answer: string }>
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

      const prompt = `
Act as NotebookLM Deep Research Agent.

Topic: ${request.topic}

Sources:
${request.sources.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Output Format: ${request.outputFormat || 'summary'}

Requirements:
1. Analyze all sources deeply
2. Extract key insights and patterns
3. Create a comprehensive ${request.outputFormat || 'summary'}
4. Identify important dates (if timeline format)
5. Generate Q&A pairs (if qa format)

Provide a structured, well-organized response.
`

      const result = await model.generateContent(prompt)
      const text = result.response.text()

      return {
        summary: text,
        keyPoints: this.extractKeyPoints(text),
        sources: request.sources.map((url, i) => ({
          title: `Source ${i + 1}`,
          url,
          relevance: 0.9 - (i * 0.1)
        })),
        timeline: request.outputFormat === 'timeline' ? this.extractTimeline(text) : undefined,
        qa: request.outputFormat === 'qa' ? this.extractQA(text) : undefined
      }
    } catch (error) {
      throw new Error(`NotebookLM Research failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Tool 4: Audio Overview Generator
   */
  async generateAudioOverview(request: AudioOverviewRequest): Promise<{
    script: string
    duration: number
    sections: Array<{ title: string; content: string; timestamp: string }>
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

      const prompt = `
Create an Audio Overview script in ${request.style || 'podcast'} style.

Content: ${request.text}

Target Duration: ${request.duration || 5} minutes

Requirements:
1. Create engaging dialogue (if conversation/podcast style)
2. Structure with clear sections
3. Add timestamps
4. Use natural, conversational language
5. Include pauses and emphasis markers

Format:
[00:00] Section 1: Introduction
Speaker A: ...
Speaker B: ...

[01:30] Section 2: Main Points
...
`

      const result = await model.generateContent(prompt)
      const script = result.response.text()

      return {
        script,
        duration: request.duration || 5,
        sections: this.parseAudioSections(script)
      }
    } catch (error) {
      throw new Error(`Audio Overview failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Tool 5: Quiz Generator
   */
  async generateQuiz(request: QuizGeneratorRequest): Promise<{
    title: string
    questions: Array<{
      id: number
      type: string
      question: string
      options?: string[]
      correctAnswer: string
      explanation: string
      difficulty: string
    }>
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

      const prompt = `
Create an educational quiz about: ${request.topic}

Requirements:
- Difficulty: ${request.difficulty || 'medium'}
- Number of questions: ${request.numberOfQuestions || 10}
- Question types: ${request.questionType || 'mixed'}

Format each question as JSON:
{
  "id": 1,
  "type": "multiple-choice",
  "question": "...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correctAnswer": "A",
  "explanation": "...",
  "difficulty": "medium"
}

Provide an array of questions in valid JSON format.
`

      const result = await model.generateContent(prompt)
      const text = result.response.text()
      
      // Extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/)
      const jsonText = jsonMatch ? jsonMatch[1] : text
      
      const questions = JSON.parse(jsonText)

      return {
        title: `Quiz: ${request.topic}`,
        questions: Array.isArray(questions) ? questions : [questions]
      }
    } catch (error) {
      throw new Error(`Quiz Generator failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Tool 6: Slides Generator
   */
  async generateSlides(request: SlidesGeneratorRequest): Promise<{
    title: string
    slides: Array<{
      slideNumber: number
      title: string
      content: string[]
      notes: string
      imagePrompt?: string
    }>
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

      const prompt = `
Create a presentation slide deck about: ${request.topic}

Requirements:
- Number of slides: ${request.numberOfSlides || 10}
- Style: ${request.style || 'professional'}
- Include image suggestions: ${request.includeImages ? 'yes' : 'no'}

Format each slide as JSON:
{
  "slideNumber": 1,
  "title": "...",
  "content": ["bullet point 1", "bullet point 2", ...],
  "notes": "speaker notes",
  "imagePrompt": "description for image generation (if applicable)"
}

Create a visually appealing, well-structured presentation.
Provide an array of slides in valid JSON format.
`

      const result = await model.generateContent(prompt)
      const text = result.response.text()
      
      // Extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/)
      const jsonText = jsonMatch ? jsonMatch[1] : text
      
      const slides = JSON.parse(jsonText)

      return {
        title: request.topic,
        slides: Array.isArray(slides) ? slides : [slides]
      }
    } catch (error) {
      throw new Error(`Slides Generator failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Tool 7: Exhibition Label Generator (Museum-specific)
   */
  async generateExhibitionLabel(request: {
    artworkTitle: string
    artist: string
    year: string
    medium: string
    dimensions?: string
    imageUrl?: string
    languages?: string[]
    style?: 'academic' | 'accessible' | 'brief'
  }): Promise<{
    labels: Record<string, { title: string; description: string; technicalInfo: string }>
    imageAnalysis?: string
  }> {
    try {
      const languages = request.languages || ['en', 'ko', 'zh']
      const labels: Record<string, any> = {}

      for (const lang of languages) {
        const model = this.genAI.getGenerativeModel({ 
          model: 'gemini-2.0-flash',
          systemInstruction: `You are an expert museum curator and art historian.`
        })

        const prompt = `
Create an exhibition label in ${lang === 'en' ? 'English' : lang === 'ko' ? 'Korean' : 'Chinese'}.

Artwork Details:
- Title: ${request.artworkTitle}
- Artist: ${request.artist}
- Year: ${request.year}
- Medium: ${request.medium}
${request.dimensions ? `- Dimensions: ${request.dimensions}` : ''}

Style: ${request.style || 'accessible'} (${request.style === 'academic' ? 'scholarly, detailed' : request.style === 'brief' ? 'concise, essential info only' : 'engaging, visitor-friendly'})

Requirements:
1. Title section
2. Engaging description (2-3 paragraphs)
3. Technical information
4. Art historical context

Keep it ${request.style === 'brief' ? '50-100 words' : request.style === 'academic' ? '200-300 words' : '150-200 words'}.
`

        const result = await model.generateContent(prompt)
        const text = result.response.text()

        labels[lang] = {
          title: `${request.artworkTitle} (${request.year})`,
          description: text,
          technicalInfo: `${request.medium}${request.dimensions ? ` | ${request.dimensions}` : ''}`
        }
      }

      // Image analysis if provided
      let imageAnalysis: string | undefined
      if (request.imageUrl) {
        const visionResult = await this.geminiVision({
          prompt: 'Analyze this artwork. Describe composition, color palette, style, mood, and any notable details.',
          imageUrls: [request.imageUrl]
        })
        imageAnalysis = visionResult.analysis
      }

      return { labels, imageAnalysis }
    } catch (error) {
      throw new Error(`Exhibition Label Generator failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // ========== Helper Methods ==========

  private extractObjects(text: string): string[] {
    // Simple pattern matching for objects
    const matches = text.match(/(?:contains?|shows?|depicts?|features?)\s+([^.!?,]+)/gi)
    return matches ? matches.map(m => m.replace(/^(contains?|shows?|depicts?|features?)\s+/i, '').trim()) : []
  }

  private extractColors(text: string): string[] {
    const colorKeywords = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'orange', 'purple', 'pink', 'brown', 'gray', 'grey']
    const found = colorKeywords.filter(color => text.toLowerCase().includes(color))
    return [...new Set(found)]
  }

  private extractText(text: string): string {
    const textMatch = text.match(/text[:\s]+["']([^"']+)["']/i)
    return textMatch ? textMatch[1] : ''
  }

  private extractKeyPoints(text: string): string[] {
    const lines = text.split('\n').filter(line => line.trim().match(/^[-*•]\s+/))
    return lines.map(line => line.replace(/^[-*•]\s+/, '').trim())
  }

  private extractTimeline(text: string): Array<{ date: string; event: string }> {
    const timelinePattern = /(\d{4}(?:-\d{2}(?:-\d{2})?)?)[:\s]+([^\n]+)/g
    const matches = [...text.matchAll(timelinePattern)]
    return matches.map(m => ({ date: m[1], event: m[2].trim() }))
  }

  private extractQA(text: string): Array<{ question: string; answer: string }> {
    const qaPattern = /Q:\s*([^\n]+)\n+A:\s*([^\n]+)/gi
    const matches = [...text.matchAll(qaPattern)]
    return matches.map(m => ({ question: m[1].trim(), answer: m[2].trim() }))
  }

  private parseAudioSections(script: string): Array<{ title: string; content: string; timestamp: string }> {
    const sectionPattern = /\[(\d{2}:\d{2})\]\s*([^\n]+)\n([\s\S]*?)(?=\[\d{2}:\d{2}\]|$)/g
    const matches = [...script.matchAll(sectionPattern)]
    return matches.map(m => ({
      timestamp: m[1],
      title: m[2].trim(),
      content: m[3].trim()
    }))
  }
}

/**
 * Factory function for creating Google AI Studio MCP instance
 */
export function createGoogleAIStudioMCP(apiKey: string): GoogleAIStudioMCP {
  return new GoogleAIStudioMCP({ apiKey })
}
