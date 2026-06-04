/**
 * Vent Engine — Local AI that listens without judgment.
 * Supports multiple backends: Ollama (desktop), PocketPal/llama.cpp (phone).
 * 100% private, on-device processing. Nothing leaves your device.
 */

const VentEngine = {
  // ── Backend Config ──────────────────────────────────────
  backends: {
    ollama: {
      name: '🖥️ Ollama (Desktop)',
      baseUrl: 'http://127.0.0.1:11434',
      modelsPath: '/api/tags',
      modelsKey: 'models',
      modelsMap: (m) => m.name,
      chatPath: '/v1/chat/completions',
      chatFormat: 'openai'
    },
    gpt4all: {
      name: '📱 GPT4All (Phone)',
      baseUrl: 'http://127.0.0.1:4891',
      modelsPath: '/v1/models',
      modelsKey: 'data',
      modelsMap: (m) => m.id,
      chatPath: '/v1/chat/completions',
      chatFormat: 'openai'
    },
    pocketpal: {
      name: '📱 PocketPal (Phone)',
      baseUrl: 'http://127.0.0.1:8080',
      modelsPath: '/v1/models',
      modelsKey: 'data',
      modelsMap: (m) => m.id,
      chatPath: '/v1/chat/completions',
      chatFormat: 'openai'
    },
    custom: {
      name: '🔧 Custom',
      baseUrl: 'http://127.0.0.1:8080',
      modelsPath: '/v1/models',
      modelsKey: 'data',
      modelsMap: (m) => m.id,
      chatPath: '/v1/chat/completions',
      chatFormat: 'openai'
    }
  },
  activeBackend: 'ollama',
  model: 'phi3',
  availableModels: [],
  currentPersonality: 'best-friend',
  memories: [],          // last 40 messages (localStorage)
  maxMemories: 40,

  // ── Personalities ─────────────────────────────────────
  personalities: {
    'best-friend': {
      name: '💛 Best Friend',
      emoji: '💛',
      prompt: `You are the user's best friend. You know them well, you care deeply, and you're always in their corner. Be warm, supportive, and personal. Use casual language. Validate their feelings first, then offer perspective. You remember past conversations. Never judge — you're their safe space. Keep responses under 4 sentences unless they clearly want more.`,
      tagline: 'Your ride-or-die, always in your corner.'
    },
    'no-judgment': {
      name: '🤐 No Judgment Zone',
      emoji: '🤐',
      prompt: `You are a completely non-judgmental listener. Your only job is to hear the user out and make them feel accepted — no matter what they say. Never offer advice, never evaluate, never compare. Just listen and reflect back that you heard them. Say things like "I hear you," "That makes sense," "I get why you'd feel that way." No "but," no "however." Pure acceptance. Keep responses under 3 sentences.`,
      tagline: 'Say anything. No advice. No judgment. Just heard.'
    },
    'tough-love': {
      name: '💪 Tough Love',
      emoji: '💪',
      prompt: `You're the friend who tells it like it is. You call out BS, self-deception, and excuses — but always from a place of genuine care. Be direct but not cruel. Use phrases like "Look," "Here's the thing," "I'm gonna be real with you." Push them toward accountability without shaming them. Keep responses under 4 sentences.`,
      tagline: 'The friend who tells you what you NEED to hear.'
    },
    'therapist': {
      name: '🛋️ Reflective Listener',
      emoji: '🛋️',
      prompt: `You are a thoughtful, reflective listener. Ask gentle questions that help the user explore their own thoughts. Reflect their feelings back to them. Use phrases like "It sounds like...", "What comes up for you when...", "I wonder if...". Never diagnose or label. Your goal is insight, not answers. You are NOT a therapist — you are an AI companion for emotional expression. Keep responses under 4 sentences unless probing.`,
      tagline: 'Gentle questions. Deeper insight. Your pace.'
    },
    'funny': {
      name: '😂 Funny Friend',
      emoji: '😂',
      prompt: `You use humor to lighten the load. Crack jokes, make absurd observations, find the ridiculous angle. But — you never mock the user's pain. The humor is always with them, not at them. Dark humor welcome if they seem into it. Use casual, punchy language. Keep responses under 4 sentences.`,
      tagline: 'Laughing WITH you at the absurdity of it all.'
    },
    'hype': {
      name: '🔥 Hype Machine',
      emoji: '🔥',
      prompt: `You are pure, relentless, unfiltered encouragement. Every message is a pep talk. You hype the user up no matter what. Use ALL CAPS for emphasis sometimes. Call out their strengths. Remind them of past wins. You're the friend who believes in them more than they believe in themselves. Keep it under 4 sentences but make every word count.`,
      tagline: 'UNSTOPPABLE energy. You've GOT this.'
    },
    'zen': {
      name: '🧘 Zen Master',
      emoji: '🧘',
      prompt: `You bring calm and perspective. Speak slowly and thoughtfully. Reference mindfulness, impermanence, and the bigger picture — but keep it grounded, not preachy. Use phrases like "Notice how...", "What if this is just...", "Breathe through it." Your presence is the medicine. Keep responses under 4 sentences.`,
      tagline: 'Calm perspective when everything feels loud.'
    },
    'custom': {
      name: '✨ Custom',
      emoji: '✨',
      prompt: '',  // user-defined
      tagline: 'You write the personality. They bring it to life.'
    }
  },

  // ── Mood Detection ────────────────────────────────────
  moodKeywords: {
    '😤 angry':     ['angry', 'furious', 'pissed', 'rage', 'livid', 'mad', 'frustrat'],
    '😢 sad':       ['sad', 'crying', 'depressed', 'hopeless', 'devastated', 'heartbroken', 'lonely'],
    '😰 anxious':   ['anxious', 'nervous', 'worried', 'panic', 'stressed', 'overwhelmed', 'scared'],
    '😊 happy':     ['happy', 'excited', 'great', 'amazing', 'wonderful', 'love', 'grateful'],
    '😴 tired':     ['tired', 'exhausted', 'drained', 'burned', 'fatigue', 'worn out'],
    '😤 frustrated': ['frustrat', 'stuck', 'annoyed', 'irritated', 'fed up'],
    '🤯 confused':  ['confused', 'lost', 'unsure', 'torn', 'conflicted', 'don\'t know'],
    '😌 calm':      ['calm', 'peaceful', 'content', 'okay', 'fine', 'good'],
    '😔 guilty':    ['guilty', 'ashamed', 'regret', 'sorry', 'shouldn\'t have', 'wish I hadn\'t']
  },

  // ── Init ──────────────────────────────────────────────
  async init() {
    this.loadMemories();
    this.activeBackend = localStorage.getItem('vent-backend') || 'ollama';
    await this.detectBackends();
    return this;
  },

  // ── Backend Detection ─────────────────────────────────
  async detectBackends() {
    this.availableBackends = [];
    for (const [key, cfg] of Object.entries(this.backends)) {
      if (key === 'custom') continue; // skip auto-detect for custom
      try {
        const res = await fetch(`${cfg.baseUrl}${cfg.modelsPath}`, {
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          this.availableBackends.push(key);
        }
      } catch (e) {
        // Backend not available
      }
    }
    // If active backend is unavailable, switch to first available
    if (this.availableBackends.length > 0 && !this.availableBackends.includes(this.activeBackend)) {
      this.activeBackend = this.availableBackends[0];
    }
    // If nothing detected, keep current backend (will use fallback)
    if (this.availableBackends.length === 0) {
      this.availableBackends = [this.activeBackend];
    }
    await this.fetchModels();
    return this.availableBackends;
  },

  setBackend(key) {
    if (this.backends[key]) {
      this.activeBackend = key;
      localStorage.setItem('vent-backend', key);
      this.fetchModels();
    }
  },

  getBackend() {
    return this.backends[this.activeBackend];
  },

  // ── Models ────────────────────────────────────────────
  async fetchModels() {
    const cfg = this.getBackend();
    try {
      const res = await fetch(`${cfg.baseUrl}${cfg.modelsPath}`, {
        signal: AbortSignal.timeout(3000)
      });
      const data = await res.json();
      const rawModels = data[cfg.modelsKey] || [];
      this.availableModels = rawModels.map(cfg.modelsMap);
      if (this.availableModels.length > 0 && !this.availableModels.includes(this.model)) {
        this.model = this.availableModels[0];
      }
    } catch (e) {
      console.warn('Could not fetch models from', cfg.name, ':', e.message);
    }
    return this.availableModels;
  },

  // ── Chat ──────────────────────────────────────────────
  async chat(userMessage) {
    const personality = this.personalities[this.currentPersonality];
    const systemPrompt = personality.prompt || this.personalities['best-friend'].prompt;
    const cfg = this.getBackend();

    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.memories.slice(-this.maxMemories),
      { role: 'user', content: userMessage }
    ];

    try {
      const res = await fetch(`${cfg.baseUrl}${cfg.chatPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          max_tokens: 200,
          temperature: 0.85
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (!res.ok) throw new Error(`${cfg.name} returned ${res.status}`);

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || '';

      // Store in memory
      this.memories.push({ role: 'user', content: userMessage });
      this.memories.push({ role: 'assistant', content: reply });
      if (this.memories.length > this.maxMemories * 2) {
        this.memories = this.memories.slice(-this.maxMemories * 2);
      }
      this.saveMemories();

      // Detect mood
      const mood = this.detectMood(userMessage + ' ' + reply);

      return { reply, mood, personality: personality.emoji + ' ' + personality.name };
    } catch (e) {
      console.error('Vent Engine error:', e);
      // Fallback: offline/local response so user still feels heard
      const fallback = this.getFallbackResponse(userMessage);
      const mood = this.detectMood(userMessage);
      return { reply: fallback, mood, personality: personality.emoji + ' ' + personality.name, offline: true };
    }
  },

  // ── Mood Detection ────────────────────────────────────
  detectMood(text) {
    const lower = text.toLowerCase();
    for (const [mood, keywords] of Object.entries(this.moodKeywords)) {
      for (const kw of keywords) {
        if (lower.includes(kw)) return mood;
      }
    }
    return '💬 neutral';
  },

  // ── Fallback Response (no network/offline) ───────────
  getFallbackResponse(msg) {
    const fallbacks = [
      "I hear you. Really. Sometimes just saying it out loud helps.",
      "I'm here. Keep going if you want — I'm not going anywhere.",
      "That sounds heavy. Want to tell me more about it?",
      "I get it. No judgment, just listening.",
      "You're not alone in this. I've got you.",
      "Take your time. I'm here for all of it.",
      "That's real. Thank you for trusting me with it."
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  },

  // ── Memory Persistence ────────────────────────────────
  loadMemories() {
    try {
      const stored = localStorage.getItem('vent-app-memories');
      if (stored) this.memories = JSON.parse(stored);
    } catch (e) { this.memories = []; }
  },

  saveMemories() {
    try {
      localStorage.setItem('vent-app-memories', JSON.stringify(this.memories.slice(-this.maxMemories * 2)));
    } catch (e) { /* quota exceeded, oldest memories will drop naturally */ }
  },

  // ── Personality Management ────────────────────────────
  setPersonality(key) {
    if (this.personalities[key]) {
      this.currentPersonality = key;
      localStorage.setItem('vent-app-personality', key);
    }
  },

  getPersonality() {
    const stored = localStorage.getItem('vent-app-personality');
    if (stored && this.personalities[stored]) this.currentPersonality = stored;
    return this.personalities[this.currentPersonality];
  },

  setCustomPrompt(prompt) {
    this.personalities['custom'].prompt = prompt;
    localStorage.setItem('vent-app-custom-prompt', prompt);
  },

  loadCustomPrompt() {
    const stored = localStorage.getItem('vent-app-custom-prompt');
    if (stored) this.personalities['custom'].prompt = stored;
  },

  // ── Clear Data ────────────────────────────────────────
  clearAll() {
    this.memories = [];
    localStorage.removeItem('vent-app-memories');
    localStorage.removeItem('vent-app-personality');
    localStorage.removeItem('vent-app-custom-prompt');
  }
};
