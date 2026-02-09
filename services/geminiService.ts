
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { AIResponse, Flashcard, QuizQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function askStandardAI(question: string, context: string): Promise<AIResponse> {
  const model = ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `CONTEXT:\n${context}\n\nQUESTION:\n${question}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: { type: Type.STRING },
          citations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                standard: { type: Type.STRING },
                clause: { type: Type.STRING },
                page: { type: Type.NUMBER }
              },
              required: ["standard", "clause", "page"]
            }
          }
        },
        required: ["answer", "citations"]
      }
    }
  });

  try {
    const response = await model;
    const data = JSON.parse(response.text || '{}');
    return {
      answer: data.answer || "No information found.",
      citations: Array.isArray(data.citations) ? data.citations : []
    };
  } catch (error) {
    console.error("StandardAI Parse Error:", error);
    return { answer: "Error processing the response.", citations: [] };
  }
}

export async function generateFlashcards(context: string, standardName: string): Promise<Flashcard[]> {
  const model = ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `FILENAME: ${standardName}\n\nBased on the following document text, generate 10 unique flashcards with a clear engineering question and a concise factual answer. 
    TEXT:\n${context}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION + "\nGenerate exactly 10 flashcards for this standard. Ensure the text is clean and free of underscores or dots from the source PDF.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            answer: { type: Type.STRING },
            citations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  standard: { type: Type.STRING },
                  clause: { type: Type.STRING },
                  page: { type: Type.NUMBER }
                },
                required: ["standard", "clause", "page"]
              }
            }
          }
        }
      }
    }
  });

  try {
    const response = await model;
    const data = JSON.parse(response.text || '[]');
    if (!Array.isArray(data)) return [];
    return data.map((card: any) => ({
      ...card,
      id: card.id || crypto.randomUUID(),
      citations: Array.isArray(card.citations) ? card.citations : []
    }));
  } catch (error) {
    console.error("Flashcard Generation Error:", error);
    return [];
  }
}

export async function generateQuiz(context: string, standardName: string): Promise<QuizQuestion[]> {
  const model = ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `FILENAME: ${standardName}\n\nBased on the following document text, generate 10 professional multiple choice questions.
    
    REQUIREMENTS:
    1. The question must be a complete sentence. 
    2. The "correctAnswer" must be a direct fact/value from the text.
    3. The 3 "distractors" MUST be other real values, categories, or requirements found within the same text (not made up by AI).
    4. Strip all trailing underscores or form-fill artifacts from the question and options.
    
    TEXT:\n${context}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION + "\nFocus on high-value engineering knowledge. Ensure the final JSON contains no strings with multiple consecutive underscores or dots.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            correctAnswer: { type: Type.STRING },
            distractors: { type: Type.ARRAY, items: { type: Type.STRING } },
            citations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  standard: { type: Type.STRING },
                  clause: { type: Type.STRING },
                  page: { type: Type.NUMBER }
                },
                required: ["standard", "clause", "page"]
              }
            }
          }
        }
      }
    }
  });

  try {
    const response = await model;
    const data = JSON.parse(response.text || '[]');
    if (!Array.isArray(data)) return [];
    return data.map((q: any) => ({
      ...q,
      id: q.id || crypto.randomUUID(),
      distractors: Array.isArray(q.distractors) ? q.distractors : [],
      citations: Array.isArray(q.citations) ? q.citations : []
    }));
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    return [];
  }
}
