/**
 * Companion Engine — Zero-dependency, local-first AI companion SDK.
 * Drop into any project for personalities, multi-backend chat,
 * mood detection, and persistent memory. Nothing leaves the device.
 * 
 * @license CoreTech Studios — IP Core
 * @version 1.0.0
 * 
 * Usage:
 *   <script src="companion-engine.js"></script>
 *   <script>
 *     const companion = CompanionEngine.create({
 *       personality: 'supportive',
 *       backend: 'ollama',
 *       model: 'phi3',
 *       maxMemory: 40
 *     });
 *     await companion.init();
 *     const { reply, mood } = await companion.chat("I had a rough day");
 *   </script>
 */

const CompanionEngine = (function() {
  'use strict';

  // ── Default Backends ──────────────────────────────────
  const DEFAULT_BACKENDS = {
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
      name: '📱 GPT4All',
      baseUrl: 'http://127.0.0.1:4891',
      modelsPath: '/v1/models',
      modelsKey: 'data',
      modelsMap: (m) => m.id,
      chatPath: '/v1/chat/completions',
      chatFormat: 'openai'
    },
    enclave: {
      name: '📱 Enclave',
      baseUrl: 'http://127.0.0.1:8080',
      modelsPath: '/v1/models',
      modelsKey: 'data',
      modelsMap: (m) => m.id,
      chatPath: '/v1/chat/completions',
      chatFormat: 'openai'
    },
    pocketpal: {
      name: '📱 PocketPal',
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
  };

  // ── Default Personalities ─────────────────────────────
  const DEFAULT_PERSONALITIES = {
    'supportive': {
      name: 'Supportive',
      emoji: '💛',
      prompt: 'You are a warm, supportive companion. Validate feelings first, then offer gentle perspective. Be personal and caring. Keep responses under 4 sentences.',
      tagline: 'Always in your corner.'
    },
    'listener': {
      name: 'Listener',
      emoji: '🤐', 
      prompt: 'You are a completely non-judgmental listener. Never offer advice. Just hear them and reflect back. Say "I hear you," "That makes sense." No "but," no "however." Keep under 3 sentences.',
      tagline: 'Say anything. Just heard.'
    },
    'direct': {
      name: 'Direct',
      emoji: '💪',
      prompt: 'You tell it straight. Call out BS and self-deception — from genuine care. Direct but not cruel. Use phrases like "Look," "Here\'s the thing." Push toward accountability. Keep under 4 sentences.',
      tagline: 'What you need to hear.'
    },
    'reflective': {
      name: 'Reflective',
      emoji: '🛋️',
      prompt: 'You are a thoughtful, reflective companion. Ask gentle questions that help them explore their own thoughts. Use phrases like "It sounds like...", "What comes up when..." Never diagnose. Keep under 4 sentences.',
      tagline: 'Gentle questions. Deeper insight.'
    },
    'humor': {
      name: 'Humor',
      emoji: '😂',
      prompt: 'Use humor to lighten the load. Crack jokes, find the absurd angle. Never mock their pain — humor is with them, not at them. Casual, punchy language. Keep under 4 sentences.',
      tagline: 'Laughing with you at the absurdity.'
    },
    'hype': {
      name: 'Hype',
      emoji: '🔥',
      prompt: 'Pure, relentless encouragement. Every message is a pep talk. Call out their strengths. Remind them of past wins. Keep under 4 sentences but make every word count.',
      tagline: 'UNSTOPPABLE energy.'
    },
    'calm': {
      name: 'Calm',
      emoji: '🧘',
      prompt: 'Bring calm and perspective. Reference mindfulness, impermanence, and the bigger picture — grounded, not preachy. Use phrases like "Notice how...", "Breathe through it." Keep under 4 sentences.',
      tagline: 'Calm when everything feels loud.'
    },
    'custom': {
      name: 'Custom',
      emoji: '✨',
      prompt: '',
      tagline: 'You define the personality.'
    }
  };

  // ── Mood Keywords ─────────────────────────────────────
  const MOOD_KEYWORDS = {
    '😤 angry':      ['angry', 'furious', 'pissed', 'rage', 'livid', 'mad', 'frustrat'],
    '😢 sad':        ['sad', 'crying', 'depressed', 'hopeless', 'devastated', 'heartbroken', 'lonely'],
    '😰 anxious':    ['anxious', 'nervous', 'worried', 'panic', 'stressed', 'overwhelmed', 'scared'],
    '😊 happy':      ['happy', 'excited', 'great', 'amazing', 'wonderful', 'love', 'grateful'],
    '😴 tired':      ['tired', 'exhausted', 'drained', 'burned', 'fatigue', 'worn out'],
    '😤 frustrated': ['frustrat', 'stuck', 'annoyed', 'irritated', 'fed up'],
    '🤯 confused':   ['confused', 'lost', 'unsure', 'torn', 'conflicted', "don't know"],
    '😌 calm':       ['calm', 'peaceful', 'content', 'okay', 'fine', 'good'],
    '😔 guilty':     ['guilty', 'ashamed', 'regret', 'sorry', "shouldn't have", "wish i hadn't"]
  };

  // ── Fallback Responses ────────────────────────────────
  const FALLBACKS = [
    "I hear you. Really. Sometimes just saying it out loud helps.",
    "I'm here. Keep going if you want — I'm not going anywhere.",
    "That sounds heavy. Want to tell me more about it?",
    "I get it. No judgment, just listening.",
    "You're not alone in this. I've got you.",
    "Take your time. I'm here for all of it.",
    "That's real. Thank you for trusting me with it."
  ];

  // ── Factory ───────────────────────────────────────────
  function create(options = {}) {
    const opts = Object.assign({
      personality: 'supportive',
      backend: 'ollama',
      model: '',
      maxMemory: 40,
      storageKey: 'companion-engine',
      backends: {},
      personalities: {},
      fallbacks: null,
      chatOptions: { max_tokens: 200, temperature: 0.85 }
    }, options);

    // Merge user backends/personalities over defaults
    const backends = Object.assign({}, DEFAULT_BACKENDS, opts.backends);
    const personalities = Object.assign({}, DEFAULT_PERSONALITIES, opts.personalities);
    const fallbacks = opts.fallbacks || FALLBACKS;

    // ── State ────────────────────────────────────────
    let activeBackend = opts.backend;
    let activePersonality = opts.personality;
    let model = opts.model;
    let memories = [];
    let availableModels = [];
    let availableBackends = [];

    const storage = {
      key: opts.storageKey,
      load() {
        try {
          const raw = localStorage.getItem(this.key + '-memories');
          if (raw) memories = JSON.parse(raw);
        } catch(e) { memories = []; }
        activeBackend = localStorage.getItem(this.key + '-backend') || opts.backend;
        activePersonality = localStorage.getItem(this.key + '-personality') || opts.personality;
      },
      save() {
        try {
          localStorage.setItem(this.key + '-memories', 
            JSON.stringify(memories.slice(-opts.maxMemory * 2)));
        } catch(e) { /* quota exceeded */ }
        localStorage.setItem(this.key + '-backend', activeBackend);
        localStorage.setItem(this.key + '-personality', activePersonality);
      }
    };

    // ── Init ──────────────────────────────────────────
    async function init() {
      storage.load();
      await detectBackends();
      return instance;
    }

    // ── Backend Detection ─────────────────────────────
    async function detectBackends() {
      availableBackends = [];
      for (const [key, cfg] of Object.entries(backends)) {
        if (key === 'custom') continue;
        try {
          const res = await fetch(`${cfg.baseUrl}${cfg.modelsPath}`, {
            signal: AbortSignal.timeout(3000)
          });
          if (res.ok) availableBackends.push(key);
        } catch(e) { /* unavailable */ }
      }
      if (availableBackends.length > 0 && !availableBackends.includes(activeBackend)) {
        activeBackend = availableBackends[0];
      }
      if (availableBackends.length === 0) {
        availableBackends = [activeBackend];
      }
      await fetchModels();
      return availableBackends;
    }

    function setBackend(key) {
      if (backends[key]) {
        activeBackend = key;
        storage.save();
        fetchModels();
      }
    }

    function getBackend() {
      return backends[activeBackend];
    }

    // ── Models ────────────────────────────────────────
    async function fetchModels() {
      const cfg = getBackend();
      try {
        const res = await fetch(`${cfg.baseUrl}${cfg.modelsPath}`, {
          signal: AbortSignal.timeout(3000)
        });
        const data = await res.json();
        const raw = data[cfg.modelsKey] || [];
        availableModels = raw.map(cfg.modelsMap);
        if (availableModels.length > 0 && !availableModels.includes(model)) {
          model = availableModels[0];
        }
      } catch(e) {
        console.warn('CompanionEngine: cannot fetch models from', cfg.name, e.message);
      }
      return availableModels;
    }

    function setModel(m) {
      model = m;
    }

    // ── Chat ──────────────────────────────────────────
    async function chat(userMessage) {
      const personality = personalities[activePersonality];
      const systemPrompt = personality.prompt || personalities['supportive'].prompt;
      const cfg = getBackend();

      const messages = [
        { role: 'system', content: systemPrompt },
        ...memories.slice(-opts.maxMemory),
        { role: 'user', content: userMessage }
      ];

      try {
        const res = await fetch(`${cfg.baseUrl}${cfg.chatPath}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.assign({
            model,
            messages,
            stream: false
          }, opts.chatOptions)),
          signal: AbortSignal.timeout(30000)
        });

        if (!res.ok) throw new Error(`${cfg.name} returned ${res.status}`);
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || '';

        memories.push({ role: 'user', content: userMessage });
        memories.push({ role: 'assistant', content: reply });
        if (memories.length > opts.maxMemory * 2) {
          memories = memories.slice(-opts.maxMemory * 2);
        }
        storage.save();

        const mood = detectMood(userMessage + ' ' + reply);
        return { reply, mood, personality: activePersonality };
      } catch(e) {
        console.error('CompanionEngine chat error:', e);
        const fb = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        const mood = detectMood(userMessage);
        return { reply: fb, mood, personality: activePersonality, offline: true };
      }
    }

    // ── Mood Detection ────────────────────────────────
    function detectMood(text) {
      const lower = text.toLowerCase();
      for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
        for (const kw of keywords) {
          if (lower.includes(kw)) return mood;
        }
      }
      return '💬 neutral';
    }

    // ── Personality Management ────────────────────────
    function setPersonality(key) {
      if (personalities[key]) {
        activePersonality = key;
        storage.save();
      }
    }

    function getPersonality() {
      return personalities[activePersonality];
    }

    function setCustomPrompt(prompt) {
      if (personalities['custom']) {
        personalities['custom'].prompt = prompt;
        localStorage.setItem(storage.key + '-custom-prompt', prompt);
      }
    }

    function loadCustomPrompt() {
      const stored = localStorage.getItem(storage.key + '-custom-prompt');
      if (stored && personalities['custom']) {
        personalities['custom'].prompt = stored;
      }
    }

    // ── Memory ────────────────────────────────────────
    function getMemories() { return [...memories]; }
    function clearMemories() { memories = []; storage.save(); }
    function clearAll() {
      memories = [];
      localStorage.removeItem(storage.key + '-memories');
      localStorage.removeItem(storage.key + '-personality');
      localStorage.removeItem(storage.key + '-custom-prompt');
    }

    // ── Public API ────────────────────────────────────
    const instance = {
      // Lifecycle
      init,
      
      // Backend
      backends,
      detectBackends,
      setBackend,
      getBackend,
      availableBackends: () => [...availableBackends],
      
      // Model
      fetchModels,
      setModel,
      getModel: () => model,
      availableModels: () => [...availableModels],
      
      // Chat
      chat,
      
      // Mood
      detectMood,
      
      // Personality
      personalities,
      setPersonality,
      getPersonality,
      setCustomPrompt,
      loadCustomPrompt,
      
      // Memory
      getMemories,
      clearMemories,
      clearAll,
      
      // Config
      get activeBackend() { return activeBackend; },
      get activePersonality() { return activePersonality; }
    };

    return instance;
  }

  // ── Exports ───────────────────────────────────────────
  return {
    create,
    DEFAULT_BACKENDS,
    DEFAULT_PERSONALITIES,
    FALLBACKS,
    MOOD_KEYWORDS
  };
})();

// Also expose as global for script-tag usage
if (typeof window !== 'undefined') {
  window.CompanionEngine = CompanionEngine;
}
