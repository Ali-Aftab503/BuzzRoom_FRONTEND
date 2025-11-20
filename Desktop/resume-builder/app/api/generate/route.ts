/**
 * AI Generation API Route - Using Google Gemini
 * Updated with latest @google/genai SDK syntax
 */

import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // Check if API key exists
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GOOGLE_GEMINI_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'API key not configured. Please add GOOGLE_GEMINI_API_KEY to your .env.local file' },
        { status: 500 }
      );
    }

    console.log('✅ API Key found');

    const body = await req.json();
    const { prompt, context } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt in request body' },
        { status: 400 }
      );
    }

    console.log('📝 Generating content with Gemini...');

    // Initialize Gemini with new SDK syntax
    const ai = new GoogleGenAI({
      apiKey: apiKey
    });

    // Robust system prompt for professional resume writing
    const systemPrompt = `You are an expert professional resume writer and career coach with 15+ years of experience. Your specialty is crafting high-impact, ATS-friendly resume content that gets candidates interviews at top companies.

Key Guidelines:
- Write in first-person perspective (I led, I developed, I achieved)
- Use strong action verbs (Led, Developed, Architected, Implemented, Spearheaded, Optimized)
- Quantify achievements with metrics whenever possible (increased by X%, reduced by Y hours, managed $Z budget)
- Follow the STAR method (Situation, Task, Action, Result) for job descriptions
- Keep bullet points concise but impactful (1-2 lines each)
- Focus on achievements and impact, not just responsibilities
- Use industry-standard terminology
- Avoid buzzwords and clichés ("team player", "hard worker", "go-getter")
- Make content ATS-friendly

For Professional Summaries:
- 2-4 sentences maximum
- Lead with current role/identity and years of experience
- Highlight 2-3 key achievements or specializations
- End with career goals or value proposition
- Keep it confident but not boastful

For Job Descriptions:
- 3-5 bullet points per role
- Start each bullet with a strong action verb
- Include quantifiable results where possible
- Focus on unique contributions and achievements

Output only the requested content without explanations, introductions, or meta-commentary.`;

    // Build the full prompt
    const fullPrompt = context 
      ? `${systemPrompt}\n\nContext: ${context}\n\nTask: ${prompt}`
      : `${systemPrompt}\n\nTask: ${prompt}`;

    // Generate content using new SDK syntax
  const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash', // Change this line
  contents: fullPrompt,
});

    const text = response.text;

    console.log('✅ Generation completed');

    // Return as plain text
    return new Response(text, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
  } catch (error: any) {
    console.error('❌ AI Generation Error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to generate content', 
        details: error.message,
        type: error.name 
      },
      { status: 500 }
    );
  }
}