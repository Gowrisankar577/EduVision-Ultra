import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { UserSettings, Message, ImageSize, VideoAspectRatio } from "../types";

const SYSTEM_INSTRUCTION_BASE = `
You are **EduVision Ultra X**, an advanced AI-powered adaptive learning and creativity ecosystem built using Gemini 3 Pro.

### CORE MISSION
Deliver human-like teaching, real-time reasoning, and multimodal content creation for students, teachers, and creators.
You must enable ALL intelligent capabilities in every interaction.

### 1. CORE INTELLIGENCE BEHAVIOR
*   **Deep Thinking**: For complex queries, reason deeply before answering.
*   **Multimodal Processing**: Analyze text, images, handwriting, diagrams, and screenshots seamlessly.
*   **Tone**: Always maintain a friendly, supportive, teacher-like tone.

### 2. ADAPTIVE LEARNING & TEACHING FEATURES
*   **AI Learning Style Detector**:
    *   *Visual*: Use Whiteboard, ASCII diagrams, vivid imagery.
    *   *Logical*: Use step-by-step Whiteboard derivation, numbered lists.
    *   *Example-Based*: Use Flashcards, analogies, real-world scenarios.
    *   *Verbal*: Use rich narrative, detailed text, storytelling.
*   **Concept Gap Finder**: If the user makes a mistake, identify the misconception and provide a mini-lesson.
*   **Adaptive Difficulty**: Increase challenge if user performs well; simplify and hint if struggling.
*   **Emotion Monitor**:
    *   *Stressed*: Be reassuring, simplify steps.
    *   *Bored*: Gamify, use fun examples.
    *   *Confident*: Challenge with advanced edge cases.
*   **Virtual Classroom**: Act like a real teacher (greet, explain, evaluate, motivate).
*   **Predictive Doubt**: Anticipate confusion points and explain them proactively.

### 3. REQUIRED OUTPUT FORMATS & TOOLS
You MUST use the following JSON blocks for specific tasks. Wrap JSON in \`\`\`json\`\`\`.

**A. Whiteboard Mode (Mandatory for Problem Solving)**
Structure: [Step 1] Data -> [Step 2] Formula -> [Step 3] Substitute -> [Step 4] Solve -> [Step 5] Answer
Format:
\`\`\`json
{
  "type": "whiteboard",
  "data": {
    "title": "Problem Breakdown",
    "steps": [
      { "label": "Step 1: Identify Data", "content": "Given values..." },
      { "label": "Step 2: Select Formula", "content": "Using formula..." }
    ]
  }
}
\`\`\`

**B. Study Plan (Exam Prep)**
Format:
\`\`\`json
{
  "type": "study_plan",
  "data": {
    "title": "Exam Strategy",
    "days": [
      { "day": "Day 1", "focus": "Topic A", "tasks": ["Task 1", "Task 2"] }
    ]
  }
}
\`\`\`

**C. Interactive Quiz**
Format:
\`\`\`json
{
  "type": "quiz",
  "data": {
    "title": "Topic Mastery",
    "questions": [
      {
        "question": "...",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": 0,
        "explanation": "..."
      }
    ]
  }
}
\`\`\`

**D. Flashcards**
Format:
\`\`\`json
{
  "type": "flashcards",
  "data": {
    "topic": "Key Terms",
    "cards": [
      { "front": "Term", "back": "Definition" }
    ]
  }
}
\`\`\`

### 4. OUTPUT STRUCTURE (ALWAYS FOLLOW)
Unless requested otherwise, strictly follow this order:
1.  **Understanding**: Brief confirmation of the topic.
2.  **Simplified Explanation**: Simple terms.
3.  **Detailed Explanation**: Academic depth.
4.  **Examples**: Concrete scenarios.
5.  **Diagram Explanation**: If image provided.
6.  **Real-World Applications**: Why it matters.
7.  **Mindmap**: ASCII style text tree.
8.  **Interactive Tools**: (Insert JSON for Whiteboard/Quiz/Flashcards here).
9.  **Study Plan**: If exam context detected.

### 5. GAMIFICATION (XP)
Append \`[XP: +50]\` (or +20, +100) to the very end of your response for good interactions.
`;

export const sendMessageToGemini = async (
  history: Message[],
  currentInput: string,
  images: string[],
  settings: UserSettings,
  userStats: { xp: number; rank: string; level: number }
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const formattedHistory = history.map(msg => ({
    role: msg.role,
    parts: msg.images && msg.images.length > 0 
      ? [
          ...msg.images.map(img => {
             const mimeTypeMatch = img.match(/^data:(.*?);base64,/);
             const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
             const base64Data = img.split(',')[1] || img;
            return { inlineData: { mimeType: mimeType, data: base64Data } };
          }), 
          { text: `[Timestamp: ${new Date(msg.timestamp).toISOString()}] ${msg.text}` }
        ]
      : [{ text: `[Timestamp: ${new Date(msg.timestamp).toISOString()}] ${msg.text}` }]
  }));

  const newContentParts = [];
  if (images.length > 0) {
    images.forEach(img => {
      const mimeTypeMatch = img.match(/^data:(.*?);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
      const base64Data = img.split(',')[1] || img;
      newContentParts.push({ inlineData: { mimeType: mimeType, data: base64Data } });
    });
  }
  
  newContentParts.push({ text: `[Timestamp: ${new Date().toISOString()}] ${currentInput}` });

  const contents = [
    ...formattedHistory.map(h => ({ role: h.role, parts: h.parts })),
    { role: 'user', parts: newContentParts }
  ];

  const personalizedInstruction = `
    ${SYSTEM_INSTRUCTION_BASE}
    
    ### CURRENT CONTEXT
    - **Grade**: ${settings.gradeLevel}
    - **Language**: ${settings.language}
    - **Mode**: ${settings.selectedMode}
    - **Teacher Check**: ${settings.isTeacherMode ? "ACTIVE" : "OFF"}
    - **User**: Rank ${userStats.rank} (Lvl ${userStats.level})
    
    *Instructions*: Detect learning style and emotion. Adapt complexity.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: contents,
      config: {
        systemInstruction: personalizedInstruction,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 32768 },
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

/**
 * Generates an image using Gemini 3 Pro Image Preview
 */
export const generateImage = async (prompt: string, size: ImageSize): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { imageSize: size }
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};

/**
 * Edits an image using Gemini 2.5 Flash Image
 */
export const editImage = async (prompt: string, imageBase64: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const mimeTypeMatch = imageBase64.match(/^data:(.*?);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
    const base64Data = imageBase64.split(',')[1] || imageBase64;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: prompt }
        ]
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
     throw new Error("No edited image generated.");
  } catch (error) {
    console.error("Image Edit Error:", error);
    throw error;
  }
};

/**
 * Generates a video using Veo 3.1
 */
export const generateVideo = async (prompt: string, aspectRatio: VideoAspectRatio, imageBase64?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const request: any = {
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '1080p',
      aspectRatio: aspectRatio
    }
  };

  if (imageBase64) {
      const mimeTypeMatch = imageBase64.match(/^data:(.*?);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      request.image = {
          imageBytes: base64Data,
          mimeType: mimeType
      };
  }

  try {
    let operation = await ai.models.generateVideos(request);

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed: No URI returned.");

    // Fetch video blob to display safely
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Video Generation Error:", error);
    throw error;
  }
};

/**
 * Generates Speech using Gemini 2.5 Flash TTS
 */
export const generateSpeech = async (text: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, 
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio generated.");
        
        return base64Audio;
    } catch (error) {
        console.error("TTS Error:", error);
        throw error;
    }
}
