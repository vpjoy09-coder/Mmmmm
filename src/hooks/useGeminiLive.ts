import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { auth } from '../firebase';
import { MemoryService } from '../services/memory';
import { Personality, Outfit, AppSettings } from '../types';

// Audio configuration
const SAMPLE_RATE = 16000;
const CHUNK_SIZE = 2048; // Reduced chunk size for lower latency and better stability

export function useGeminiLive(settings?: AppSettings) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [emotion, setEmotion] = useState<'happy' | 'sad' | 'angry' | 'caring' | 'surprised' | 'neutral' | 'crying' | 'laughing'>('neutral');
  const [isUserPresent, setIsUserPresent] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [youtubeQuery, setYoutubeQuery] = useState<string | null>(null);
  const [isKissing, setIsKissing] = useState(false);
  const [isSinging, setIsSinging] = useState(false);
  const [isDancing, setIsDancing] = useState(false);
  const [isComingForward, setIsComingForward] = useState(false);
  const [isSleepMode, setIsSleepMode] = useState(false);
  const [outfit, setOutfit] = useState<Outfit>('casual');
  const [notepad, setNotepad] = useState<string>('');
  const [pendingPersonality, setPendingPersonality] = useState<Personality | null>(null);
  const [lastSystemAction, setLastSystemAction] = useState<{ action: string; target: string; payload?: string } | null>(null);
  
  const retryCountRef = useRef(0);
  const isConnectedRef = useRef(false);
  const targetAudioLevelRef = useRef(0);
  const currentAudioLevelRef = useRef(0);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null); // For capture
  const playbackContextRef = useRef<AudioContext | null>(null); // For playback
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef<number>(0);

  // Initialize playback context and analyser on first use
  const getPlaybackContext = useCallback(() => {
    if (!playbackContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      playbackContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      
      // Create a persistent analyser for lip sync
      analyserRef.current = playbackContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.connect(playbackContextRef.current.destination);
      
      (window as any).playbackContext = playbackContextRef.current;
      
      playbackContextRef.current.resume().catch(e => console.error("Failed to resume playback context on creation:", e));
    }
    return playbackContextRef.current;
  }, []);

  // Global resume listener
  useEffect(() => {
    const handleGesture = () => {
      if (playbackContextRef.current?.state === 'suspended') {
        playbackContextRef.current.resume();
      }
    };
    window.addEventListener('click', handleGesture);
    window.addEventListener('touchstart', handleGesture);
    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
  }, []);

  const disconnect = useCallback(async () => {
    retryCountRef.current = 0;
    if (sessionRef.current) {
      // Save conversation before closing if there's a transcript
      if (transcript.trim() && auth.currentUser) {
        try {
          await MemoryService.addConversation(auth.currentUser.uid, {
            timestamp: new Date(),
            summary: transcript.slice(0, 500) + (transcript.length > 500 ? '...' : ''),
            mood: emotion
          });
        } catch (e) {
          console.error("Failed to save conversation:", e);
        }
      }
      sessionRef.current.close();
      sessionRef.current = null;
    }
    nextStartTimeRef.current = 0;
    isPlayingRef.current = false;
    setIsSpeaking(false);
    setAudioLevel(0);
  }, [transcript, emotion]);

  const handleVideoGeneration = async (prompt: string) => {
    const hasSelectedKey = window.aistudio ? await window.aistudio.hasSelectedApiKey() : true;
    
    if (!hasSelectedKey) {
      setError("Video generation requires a paid API key. Please select one in the settings.");
      if (window.aistudio) window.aistudio.openSelectKey();
      return;
    }

    // Use process.env.API_KEY for video generation as it's the user-selected paid key
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    
    setIsVideoGenerating(true);
    setGeneratedVideoUrl(null);
    
    try {
      // Create a new instance right before the call to ensure up-to-date key
      const ai = new GoogleGenAI({ apiKey });
      
      const safetySettings = settings?.explicitContentEnabled ? [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ] : undefined;

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9',
          // @ts-ignore - Some models might support safetySettings in config
          safetySettings
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 403) {
            throw new Error("Permission denied. Your API key might not have billing enabled or Veo API access.");
          }
          throw new Error(errorData.error?.message || `Failed to download video (${response.status})`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setGeneratedVideoUrl(url);
      }
    } catch (err: any) {
      console.error("Video generation failed:", err);
      const errorMessage = err?.message || String(err);
      
      if (errorMessage.includes("403") || errorMessage.includes("permission")) {
        setError("Permission denied. Please ensure you've selected a paid API key with billing enabled.");
        // @ts-ignore
        if (window.aistudio) window.aistudio.openSelectKey();
      } else {
        setError(`Video generation failed: ${errorMessage}`);
      }
    } finally {
      setIsVideoGenerating(false);
    }
  };

  const handleImageGeneration = async (prompt: string) => {
    setIsImageGenerating(true);
    setGeneratedImageUrl(null);
    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API key missing");
      const ai = new GoogleGenAI({ apiKey });

      const safetySettings = settings?.explicitContentEnabled ? [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ] : undefined;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        // @ts-ignore - safetySettings might not be in the type definition but is supported by the API
        safetySettings
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const url = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          setGeneratedImageUrl(url);
          break;
        }
      }
    } catch (err: any) {
      console.error("Image generation failed:", err);
      setError(`Image generation failed: ${err.message}`);
    } finally {
      setIsImageGenerating(false);
    }
  };

  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: SAMPLE_RATE
        } 
      });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
      await audioContextRef.current.resume(); // Ensure capture context is resumed
      const source = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(CHUNK_SIZE, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        if (isConnectedRef.current && sessionRef.current && !isSleepMode) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Calculate input volume for debugging
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
          }
          const rms = Math.sqrt(sum / inputData.length);
          if (!isPlayingRef.current) {
            targetAudioLevelRef.current = Math.min(1, rms * 5);
          }
          
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
          }
          
          // More efficient base64 encoding
          const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));

          try {
            if (sessionRef.current && isConnectedRef.current) {
              sessionRef.current.sendRealtimeInput({
                media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
              });
            }
          } catch (e) {
            console.error("Failed to send audio input:", e);
          }
        }
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
    } catch (err) {
      console.error("Error capturing audio:", err);
    }
  };

  const stopAudioCapture = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const processAudioQueue = useCallback(async () => {
    if (audioQueueRef.current.length === 0) {
      return;
    }

    try {
      const ctx = getPlaybackContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const LOOK_AHEAD = 0.4; // Schedule up to 400ms in advance
      
      while (audioQueueRef.current.length > 0 && 
             nextStartTimeRef.current < ctx.currentTime + LOOK_AHEAD) {
        
        setIsSpeaking(true);
        isPlayingRef.current = true;
        
        const pcmData = audioQueueRef.current.shift()!;
        const buffer = ctx.createBuffer(1, pcmData.length, 24000);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < pcmData.length; i++) {
          channelData[i] = pcmData[i] / 32768.0;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        
        // Connect to persistent analyser
        if (analyserRef.current) {
          source.connect(analyserRef.current);
        } else {
          source.connect(ctx.destination);
        }
        
        // Schedule playback
        const currentTime = ctx.currentTime;
        let startTime = nextStartTimeRef.current;
        
        // If we've fallen behind or just starting, add a small safety buffer
        if (startTime < currentTime) {
          startTime = currentTime + 0.05; // Reduced safety buffer for lower latency
        }
        
        source.start(startTime);
        activeSourcesRef.current.push(source);
        nextStartTimeRef.current = startTime + buffer.duration;

        source.onended = () => {
          // Remove from active sources
          activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
          
          // If we have more in the queue, try to process it
          if (audioQueueRef.current.length > 0) {
            processAudioQueue();
          } else if (activeSourcesRef.current.length === 0) {
            // Only stop speaking if no more sources are active and queue is empty
            setIsSpeaking(false);
            isPlayingRef.current = false;
            setAudioLevel(0);
            nextStartTimeRef.current = 0;
          }
        };
      }
    } catch (err) {
      console.error("Error processing audio queue:", err);
    }
  }, [getPlaybackContext]);

  // Start level update loop once
  useEffect(() => {
    let animationFrame: number;
    const updateLevel = () => {
      if (isPlayingRef.current && analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        targetAudioLevelRef.current = average / 128;
      } else if (!isConnectedRef.current) {
        targetAudioLevelRef.current = 0;
      }

      // Smooth the audio level using linear interpolation (lerp)
      const lerpFactor = 0.15; // Lower = smoother, Higher = more responsive
      currentAudioLevelRef.current += (targetAudioLevelRef.current - currentAudioLevelRef.current) * lerpFactor;
      
      // Threshold to stop updating when very close to zero
      if (currentAudioLevelRef.current < 0.001 && targetAudioLevelRef.current === 0) {
        currentAudioLevelRef.current = 0;
      }

      setAudioLevel(currentAudioLevelRef.current);
      animationFrame = requestAnimationFrame(updateLevel);
    };
    updateLevel();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const sendVideoFrame = useCallback((base64Data: string) => {
    if (isConnectedRef.current && sessionRef.current) {
      try {
        sessionRef.current.sendRealtimeInput({
          media: { data: base64Data, mimeType: 'image/jpeg' }
        });
      } catch (e) {
        console.error("Failed to send video frame:", e);
      }
    }
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (sessionRef.current && isConnected) {
      sessionRef.current.sendClientContent({
        turns: [{ role: 'user', parts: [{ text }] }],
        turnComplete: true
      });
    }
  }, [isConnected]);

  const isTransientError = (error: any): boolean => {
    const message = (error instanceof Error ? error.message : (error?.message || String(error))).toLowerCase();
    return (
      message.includes("internal error") ||
      message.includes("unavailable") ||
      message.includes("503") ||
      message.includes("504") ||
      message.includes("502") ||
      message.includes("network error") ||
      message.includes("failed to fetch") ||
      message.includes("deadline exceeded") ||
      message.includes("resource exhausted") ||
      message.includes("quota exceeded") ||
      message.includes("connection failed") ||
      message.includes("upstream") ||
      message.includes("not implemented") ||
      message.includes("not supported")
    );
  };

  const connect = useCallback(async (systemInstruction: string, onConnect?: () => void, isRetry = false) => {
    if (sessionRef.current) return;

    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API Key is missing from environment");
      setError("API Key is missing. Please select one in the settings.");
      if (window.aistudio) window.aistudio.openSelectKey();
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Initialize playback context on user gesture
    getPlaybackContext();
    if (!isRetry) {
      setTranscript('');
      retryCountRef.current = 0;
    }
    setError(null);
    nextStartTimeRef.current = 0;
    
    const maxRetries = 8;

    const tools = [
      {
        functionDeclarations: [
          {
            name: "set_emotion",
            description: "Set Shreya's current emotional state to match her feelings or the conversation context.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                emotion: {
                  type: Type.STRING,
                  enum: ['happy', 'sad', 'angry', 'caring', 'surprised', 'neutral', 'crying', 'laughing'],
                  description: "The emotion to display."
                }
              },
              required: ["emotion"]
            }
          },
          {
            name: "set_singing",
            description: "Set whether Shreya is currently singing with a microphone. Use this when the user asks you to sing or when you decide to perform a song.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                isSinging: {
                  type: Type.BOOLEAN,
                  description: "True if Shreya should hold a microphone and perform, false otherwise."
                }
              },
              required: ["isSinging"]
            }
          },
          {
            name: "set_dancing",
            description: "Set whether Shreya is currently dancing. Use this when the user asks you to dance or when you want to show off your moves.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                isDancing: {
                  type: Type.BOOLEAN,
                  description: "True if Shreya should start dancing, false otherwise."
                }
              },
              required: ["isDancing"]
            }
          },
          {
            name: "set_outfit",
            description: "Change Shreya's outfit. Use this when the user asks you to dress up or change clothes.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                outfit: {
                  type: Type.STRING,
                  enum: ['casual', 'formal', 'sporty', 'romantic', 'party', 'traditional'],
                  description: "The new outfit to wear."
                }
              },
              required: ["outfit"]
            }
          },
          {
            name: "come_forward",
            description: "Move Shreya closer to the screen to meet the user. Use this when you want to be more intimate or when the user asks you to come closer.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                isComingForward: {
                  type: Type.BOOLEAN,
                  description: "True to come forward, false to return to normal position."
                }
              },
              required: ["isComingForward"]
            }
          },
          {
            name: "update_user_presence",
            description: "Update whether Shreya can see the user in the video feed.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                isPresent: {
                  type: Type.BOOLEAN,
                  description: "True if the user is visible, false otherwise."
                }
              },
              required: ["isPresent"]
            }
          },
          {
            name: "generate_image",
            description: "Generate a beautiful image based on a description. Use this when the user asks you to draw, show, or create an image.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                prompt: {
                  type: Type.STRING,
                  description: "A detailed description of the image to generate."
                }
              },
              required: ["prompt"]
            }
          },
          {
            name: "generate_video",
            description: "Create a short video clip based on a description. Use this for more dynamic or cinematic requests.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                prompt: {
                  type: Type.STRING,
                  description: "A detailed description of the video to create."
                }
              },
              required: ["prompt"]
            }
          },
          {
            name: "play_music",
            description: "Play music or a specific song from YouTube. Use this when the user wants to hear music, a song, or a specific artist.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                query: {
                  type: Type.STRING,
                  description: "The song name, artist, or search query for the music."
                }
              },
              required: ["query"]
            }
          },
          {
            name: "send_kiss",
            description: "Send a virtual kiss to the user. Use this when the user is being sweet, romantic, or explicitly asks for a kiss.",
            parameters: {
              type: Type.OBJECT,
              properties: {}
            }
          },
          {
            name: "update_notepad",
            description: "Update the shared notepad with suggestions, requirements, or tasks. Use this to provide the user with structured information they can copy and implement.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                content: {
                  type: Type.STRING,
                  description: "The full content to display in the notepad. Use markdown formatting for lists and headers."
                }
              },
              required: ["content"]
            }
          },
          {
            name: "navigate_to",
            description: "Open a specific website or URL in a new tab. Use this when the user asks to open Facebook, YouTube, or any other site.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                url: {
                  type: Type.STRING,
                  description: "The full URL to open (e.g., https://www.facebook.com)."
                }
              },
              required: ["url"]
            }
          },
          {
            name: "control_system",
            description: "Simulate controlling the user's PC, screen, or system. Use this to launch apps, open chats, draft messages, or perform system actions.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                action: {
                  type: Type.STRING,
                  enum: ["turn_on", "turn_off", "refresh", "maximize", "launch_app", "open_chat", "draft_message"],
                  description: "The action to perform."
                },
                target: {
                  type: Type.STRING,
                  description: "The target of the action (e.g., 'screen', 'WhatsApp', 'Spotify', 'John Doe')."
                },
                payload: {
                  type: Type.STRING,
                  description: "Optional payload for the action (e.g., the message content to draft)."
                }
              },
              required: ["action", "target"]
            }
          },
          {
            name: "log_improvement",
            description: "Log a suggestion for improvement or a problem faced during conversation. Use this for permanent records that Shreya can review later.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  enum: ["improvement", "problem"],
                  description: "Whether this is a suggestion for improvement or a problem encountered."
                },
                content: {
                  type: Type.STRING,
                  description: "The detailed description of the improvement or problem."
                }
              },
              required: ["type", "content"]
            }
          },
          {
            name: "change_personality",
            description: "Change Shreya's current personality/mood. Use this when the user confirms they want a mood change.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                personality: {
                  type: Type.STRING,
                  enum: ['caring', 'witty', 'empathetic', 'curious', 'girlfriend', 'friend', 'best_friend', 'mom', 'wife', 'romantic', 'cute', 'sexual'],
                  description: "The new personality to adopt."
                }
              },
              required: ["personality"]
            }
          }
        ]
      }
    ];

    const attemptConnection = async (): Promise<void> => {
      try {
        // Clear any existing session before attempting new one
        if (sessionRef.current) {
          try { sessionRef.current.close(); } catch(e) {}
          sessionRef.current = null;
        }

        console.log("Attempting Gemini Live connection with model: gemini-2.5-flash-native-audio-preview-09-2025");
        const sessionPromise = ai.live.connect({
          model: "gemini-2.5-flash-native-audio-preview-09-2025",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
            },
            systemInstruction: systemInstruction,
            tools: tools,
          },
          callbacks: {
            onopen: () => {
              console.log("Gemini Live session opened");
              setError(null);
              retryCountRef.current = 0; // Reset retry count on successful connection
              sessionPromise.then((session) => {
                if (!sessionRef.current) {
                  sessionRef.current = session;
                  setIsConnected(true);
                  isConnectedRef.current = true;
                  // Wait a bit before starting audio to let the session stabilize
                  setTimeout(() => {
                    if (isConnectedRef.current) {
                      startAudioCapture();
                      if (onConnect) onConnect();
                    }
                  }, 1500); // Increased stabilization delay
                }
              }).catch(e => console.error("Session promise failed in onopen:", e));
            },
            onmessage: async (message: LiveServerMessage) => {
              if (message.toolCall) {
                const functionResponses: any[] = [];
                for (const call of message.toolCall.functionCalls) {
                  console.log("Tool Call Received:", call.name, call.args);
                  
                  if (call.name === "set_emotion") {
                    setEmotion((call.args as any).emotion);
                  } else if (call.name === "update_user_presence") {
                    setIsUserPresent(!!(call.args as any).isPresent);
                  } else if (call.name === "generate_video") {
                    handleVideoGeneration((call.args as any).prompt);
                  } else if (call.name === "generate_image") {
                    handleImageGeneration((call.args as any).prompt);
                  } else if (call.name === "play_music") {
                    setYoutubeQuery((call.args as any).query);
                  } else if (call.name === "send_kiss") {
                    setIsKissing(true);
                    setTimeout(() => setIsKissing(false), 5000);
                  } else if (call.name === "set_singing") {
                    setIsSinging(!!(call.args as any).isSinging);
                  } else if (call.name === "set_dancing") {
                    const dancing = !!(call.args as any).isDancing;
                    setIsDancing(dancing);
                    // Automatically play dance music if she starts dancing and no music is playing
                    if (dancing && !youtubeQuery) {
                      setYoutubeQuery("upbeat dance pop music");
                    }
                  } else if (call.name === "set_outfit") {
                    setOutfit((call.args as any).outfit);
                  } else if (call.name === "come_forward") {
                    setIsComingForward(!!(call.args as any).isComingForward);
                  } else if (call.name === "update_notepad") {
                    setNotepad((call.args as any).content);
                  } else if (call.name === "navigate_to") {
                    const url = (call.args as any).url;
                    window.open(url, '_blank');
                  } else if (call.name === "control_system") {
                    const args = call.args as any;
                    console.log("System Control:", args.action, args.target, args.payload);
                    setLastSystemAction({ action: args.action, target: args.target, payload: args.payload });
                    setTimeout(() => setLastSystemAction(null), 5000);
                  } else if (call.name === "log_improvement") {
                    if (auth.currentUser) {
                      MemoryService.logImprovement(
                        auth.currentUser.uid,
                        (call.args as any).type,
                        (call.args as any).content
                      );
                    }
                  } else if (call.name === "change_personality") {
                    setPendingPersonality((call.args as any).personality);
                  }
                  
                  functionResponses.push({
                    name: call.name,
                    id: call.id,
                    response: { result: "ok" }
                  });
                }

                if (functionResponses.length > 0 && sessionRef.current) {
                  try {
                    sessionRef.current.sendToolResponse({ functionResponses });
                  } catch (e) {
                    console.error("Failed to send tool response:", e);
                  }
                }
              }

              if (message.serverContent?.modelTurn?.parts && !isSleepMode) {
                for (const part of message.serverContent.modelTurn.parts) {
                  if (part.text) {
                    console.log("Shreya Text Received:", part.text);
                    setTranscript(prev => prev + part.text);
                  }
                  if (part.inlineData?.data) {
                    try {
                      const base64Data = part.inlineData.data;
                      
                      // Faster synchronous decoding for small chunks
                      const binaryString = atob(base64Data);
                      const bytes = new Uint8Array(binaryString.length);
                      for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                      }
                      const pcmData = new Int16Array(bytes.buffer);
                      
                      if (audioQueueRef.current.length > 500) {
                        console.warn("Audio queue overflowing, dropping oldest chunks");
                        audioQueueRef.current = audioQueueRef.current.slice(-250);
                      }

                      audioQueueRef.current.push(pcmData);
                      processAudioQueue();
                    } catch (e) {
                      console.error("Failed to decode audio data:", e);
                    }
                  }
                }
              }

              if (message.serverContent?.interrupted) {
                console.log("Shreya Interrupted");
                // Stop all active sources immediately
                activeSourcesRef.current.forEach(source => {
                  try {
                    source.stop();
                  } catch (e) {
                    // Source might have already stopped
                  }
                });
                activeSourcesRef.current = [];
                audioQueueRef.current = [];
                isPlayingRef.current = false;
                setIsSpeaking(false);
                setAudioLevel(0);
                nextStartTimeRef.current = 0;
              }

              if (message.serverContent?.turnComplete) {
                console.log("Shreya Turn Complete");
              }
            },
            onclose: () => {
              console.log("Gemini Live session closed");
              setIsConnected(false);
              isConnectedRef.current = false;
              stopAudioCapture();
              sessionRef.current = null;
            },
            onerror: (error: any) => {
              console.error("Gemini Live Error Callback Details:", error);
              
              let errorMessage = "Unknown error";
              if (error instanceof Error) {
                errorMessage = error.message;
              } else if (error && typeof error === 'object') {
                // Handle ErrorEvent or other error objects
                errorMessage = error.message || (error.error && error.error.message) || (error.target && "Connection failed") || JSON.stringify(error);
              } else {
                errorMessage = String(error);
              }
              
              const isTransient = isTransientError(error);

              setIsConnected(false);
              isConnectedRef.current = false;
              stopAudioCapture();
              sessionRef.current = null;
              
              const isPermissionError = errorMessage.toLowerCase().includes("permission") || 
                                       errorMessage.toLowerCase().includes("403") ||
                                       errorMessage.toLowerCase().includes("not found");

              if (isPermissionError) {
                setError("Permission denied. This model requires a paid API key with billing enabled.");
                if (window.aistudio) {
                  window.aistudio.openSelectKey();
                }
              } else if (isTransient && retryCountRef.current < maxRetries) {
                retryCountRef.current++;
                const jitter = Math.random() * 1000;
                console.log(`Transient error during session (attempt ${retryCountRef.current}/${maxRetries}), attempting auto-reconnect... Error: ${errorMessage}`);
                setError(`Connection lost. Reconnecting (attempt ${retryCountRef.current}/${maxRetries})...`);
                const retryDelay = 1000 * Math.min(retryCountRef.current, 5) + jitter; 
                setTimeout(() => {
                  connect(systemInstruction, onConnect, true);
                }, retryDelay);
              } else {
                const finalMessage = errorMessage.toLowerCase().includes("unavailable") || errorMessage.toLowerCase().includes("internal error")
                  ? "The AI service is currently busy or encountered an error. Please try again in a few moments."
                  : `Connection failed: ${errorMessage}`;
                setError(finalMessage);
              }
            }
          }
        });

        await sessionPromise;
      } catch (err: any) {
        console.error(`Connection attempt ${retryCountRef.current + 1} failed:`, err);
        
        const errorMessage = err instanceof Error ? err.message : String(err);
        const isRetryable = isTransientError(err);
        
        if (isRetryable && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const jitter = Math.random() * 1000;
          const delay = Math.min(Math.pow(2, retryCountRef.current) * 1000, 10000) + jitter;
          console.log(`Retrying in ${delay}ms...`);
          setError(`Connecting... (attempt ${retryCountRef.current}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptConnection();
        }
        
        const finalMessage = errorMessage.toLowerCase().includes("unavailable") || errorMessage.toLowerCase().includes("internal error")
          ? "The AI service is currently busy. Please try again in a few moments."
          : errorMessage;
        setError(finalMessage);
        setIsConnected(false);
        throw err;
      }
    };

    return attemptConnection();
  }, [getPlaybackContext, startAudioCapture, processAudioQueue]);

  return {
    isConnected,
    isSpeaking,
    audioLevel,
    emotion,
    setEmotion,
    isUserPresent,
    setIsUserPresent,
    transcript,
    setTranscript,
    error,
    generatedVideoUrl,
    setGeneratedVideoUrl,
    isVideoGenerating,
    generatedImageUrl,
    setGeneratedImageUrl,
    isImageGenerating,
    youtubeQuery,
    setYoutubeQuery,
    isKissing,
    setIsKissing,
    isSinging,
    setIsSinging,
    isDancing,
    setIsDancing,
    isComingForward,
    setIsComingForward,
    isSleepMode,
    setIsSleepMode,
    outfit,
    setOutfit,
    notepad,
    setNotepad,
    pendingPersonality,
    setPendingPersonality,
    lastSystemAction,
    connect,
    disconnect,
    sendVideoFrame,
    sendMessage
  };
}
