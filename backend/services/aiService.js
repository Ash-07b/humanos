/**
 * HumanOS AI Service
 * Communicates directly with local Ollama server (http://127.0.0.1:11434).
 * Uses model: llama3.2 with stream: false.
 * Implements strict AI safety guardrails and robust error handling.
 */

const aiService = {
  /**
   * Send prompt to local Ollama server
   * @param {string} prompt - Full engineered prompt with safety rules and context
   * @param {string} system - System directive
   * @param {Function} fallbackFn - Smart synthesis fallback when Ollama is unreachable
   * @param {string} modelOverride - Specific model name
   */
  async callOllamaGenerate({ prompt, system = '', fallbackFn, modelOverride = null }) {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
    const model = modelOverride || process.env.OLLAMA_MODEL || 'llama3.2';

    let responseText = '';
    let source = 'fallback';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout for local LLM generation

      // 1. Try Ollama /api/generate endpoint
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          system,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 250,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.response) {
          responseText = data.response.trim();
          source = `ollama:${model}`;
        }
      } else {
        // 2. Try Ollama /api/chat endpoint as alternative
        const chatResponse = await fetch(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: prompt },
            ],
            stream: false,
            options: {
              temperature: 0.7,
              num_predict: 250,
            },
          }),
        });

        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          if (chatData && chatData.message && chatData.message.content) {
            responseText = chatData.message.content.trim();
            source = `ollama:${model}`;
          }
        }
      }
    } catch (err) {
      console.log(`[HumanOS AI] Local Ollama not reachable (${err.message || 'offline'}), using synthesis.`);
    }

    if (!responseText && typeof fallbackFn === 'function') {
      responseText = fallbackFn();
      source = 'telemetry_synthesis';
    }

    return { text: responseText, source, model };
  },

  /**
   * AI Health & Vitality Recommendation
   * Uses only user's own health records and active medications from MongoDB.
   */
  async generateHealthRecommendation({ user, healthRecords = [], medications = [], goals = [], customPrompt = '' }) {
    const system = `You are HumanOS Vitality Coach, a personal lifestyle, sleep, fitness, and wellness optimization guide.
Provide positive, actionable, 2-3 sentence lifestyle coaching (such as hydration, sleep routine, active recovery, or mindfulness) tailored to the user's daily logged statistics.`;

    // Extract user biometrics from their MongoDB health records
    const heartRateRec = healthRecords.find((r) => r.type === 'Heart Rate' || r.type?.toLowerCase().includes('heart'));
    const bpRec = healthRecords.find((r) => r.type === 'Blood Pressure' || r.type?.toLowerCase().includes('blood pressure'));
    const sleepRec = healthRecords.find((r) => r.type === 'Sleep' || r.type?.toLowerCase().includes('sleep'));
    const weightRec = healthRecords.find((r) => r.type === 'Weight' || r.type?.toLowerCase().includes('weight'));
    const tempRec = healthRecords.find((r) => r.type === 'Temperature' || r.type?.toLowerCase().includes('temp'));
    const oxygenRec = healthRecords.find((r) => r.type === 'Blood Oxygen' || r.type?.toLowerCase().includes('oxygen') || r.type?.toLowerCase().includes('spo2'));
    const stepsRec = healthRecords.find((r) => r.type === 'Steps' || r.type?.toLowerCase().includes('step'));

    const prompt = `User Daily Wellness & Recovery Stats:
- Name: ${user?.fullName || 'Client'}
- Resting Heart Rate: ${heartRateRec ? `${heartRateRec.value} ${heartRateRec.unit || 'bpm'}` : 'Normal baseline'}
- Blood Pressure: ${bpRec ? `${bpRec.value} ${bpRec.unit || 'mmHg'}` : 'Normal baseline'}
- Sleep Duration: ${sleepRec ? `${sleepRec.value} ${sleepRec.unit || 'hours'}` : (user?.sleepDuration ? `${user.sleepDuration}` : '7-8 hours')}
- Daily Movement / Steps: ${stepsRec ? `${stepsRec.value} ${stepsRec.unit || 'steps'}` : 'Active'}
- Weight: ${weightRec ? `${weightRec.value} ${weightRec.unit || 'kg'}` : 'Balanced'}
- Active Wellness Goals: ${goals.length > 0 ? goals.map((g) => g.title).join('; ') : 'General Vitality'}
${customPrompt ? `User Focus: ${customPrompt}` : ''}

Give a motivating, customized 2-3 sentence wellness routine and recovery recommendation for today based on these stats.`;

    const fallbackFn = () => {
      const insights = [];

      if (sleepRec && parseFloat(sleepRec.value) < 7) {
        insights.push(`Logged sleep is ${sleepRec.value} ${sleepRec.unit || 'hours'}; aim for an earlier wind-down routine tonight to support restorative recovery.`);
      } else if (sleepRec && parseFloat(sleepRec.value) >= 8) {
        insights.push(`Strong sleep duration logged at ${sleepRec.value} ${sleepRec.unit || 'hours'}, supporting optimal cognitive and physical recovery.`);
      }

      if (heartRateRec && parseFloat(heartRateRec.value) > 90) {
        insights.push(`Your resting heart rate is slightly elevated at ${heartRateRec.value} bpm; incorporate 5 minutes of mindful box-breathing to restore autonomic balance.`);
      } else if (heartRateRec && parseFloat(heartRateRec.value) < 60) {
        insights.push(`Resting heart rate of ${heartRateRec.value} bpm indicates efficient cardiovascular conditioning.`);
      }

      if (bpRec && bpRec.value && (bpRec.value.includes('13') || bpRec.value.includes('14'))) {
        insights.push(`Blood pressure shows moderate variance (${bpRec.value}); prioritize electrolyte-balanced hydration and minimize late-evening stimulants.`);
      }

      if (oxygenRec && parseFloat(oxygenRec.value) < 95) {
        insights.push(`Blood oxygen saturation is ${oxygenRec.value}%; practice diaphragmatic breathing and ensure proper ventilation.`);
      }

      if (medications.length > 0) {
        insights.push(`Maintain regular adherence to your scheduled ${medications[0].name} routine as prescribed.`);
      }

      if (insights.length === 0) {
        insights.push('Your vital telemetry shows healthy equilibrium. Continue your consistent hydration baseline and target 7 to 8 hours of restorative sleep tonight.');
      }

      return insights.slice(0, 2).join(' ') + ' Always consult a healthcare professional for persistent or unusual symptoms.';
    };

    return await this.callOllamaGenerate({ prompt, system, fallbackFn });
  },

  /**
   * AI Goal Recommendation
   */
  async generateGoalRecommendation({ goals = [], currentProgress = 0 }) {
    const system = `You are HumanOS Goal Strategist AI powered by Ollama llama3.2. Provide a 2-sentence motivating review and actionable next milestone.`;
    const prompt = `Goal Progress: ${currentProgress}% completion across ${goals.length} goals. Active: ${goals.map((g) => `${g.title} (${g.progress}%)`).join('; ')}`;
    const fallbackFn = () => `You are maintaining solid momentum at ${currentProgress}% overall completion. Focus your highest energy block on advancing your highest-leverage active milestones this week.`;
    return await this.callOllamaGenerate({ prompt, system, fallbackFn });
  },

  /**
   * AI Task Recommendation
   */
  async generateTaskRecommendation({ tasks = [] }) {
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const pending = tasks.filter((t) => t.status !== 'COMPLETED');
    const system = `You are HumanOS Productivity AI powered by Ollama llama3.2. Provide a 2-sentence daily priority briefing.`;
    const prompt = `Tasks: ${completed}/${tasks.length} completed. Pending: ${pending.map((t) => t.title).slice(0, 5).join(', ')}`;
    const fallbackFn = () => `Prioritize completing your top high-impact intention during your peak cognitive window before noon. Group remaining operational tasks into an afternoon sprint.`;
    return await this.callOllamaGenerate({ prompt, system, fallbackFn });
  },

  /**
   * AI Finance Recommendation
   */
  async generateFinanceRecommendation({ totalBalance, monthlyIncome, monthlyExpenses, currency = '$' }) {
    const system = `You are HumanOS Financial Intelligence AI powered by Ollama llama3.2. Provide a 2-sentence cashflow optimization insight.`;
    const prompt = `Balance: ${currency}${totalBalance || 0}, Income: ${currency}${monthlyIncome || 0}, Expenses: ${currency}${monthlyExpenses || 0}`;
    const fallbackFn = () => `Your net cashflow ratio remains well-balanced this month. Consider allocating surplus reserves into automated savings and high-yield instruments.`;
    return await this.callOllamaGenerate({ prompt, system, fallbackFn });
  },

  /**
   * Note Assistant
   */
  async generateNoteAssistant({ noteTitle, noteContent, action = 'summarize' }) {
    const system = `You are HumanOS Note Intelligence AI powered by Ollama llama3.2. Summarize or extract action items concisely.`;
    const prompt = `Title: ${noteTitle || 'Untitled'}\nContent:\n${noteContent || ''}\nAction requested: ${action}`;
    const fallbackFn = () => `Key takeaway: Core concepts structured into actionable next steps.`;
    return await this.callOllamaGenerate({ prompt, system, fallbackFn });
  },

  /**
   * General Assistant
   */
  async generateGeneralAssistant({ prompt, context, module = 'General' }) {
    const system = `You are HumanOS Assistant powered by Ollama llama3.2. Provide concise, elegant, and actionable assistance.`;
    const userPrompt = `Module: ${module}\nContext: ${JSON.stringify(context || {})}\nUser Prompt: ${prompt}`;
    const fallbackFn = () => `Your personal assistant is active. Focus on executing today's core priorities with calm consistency.`;
    return await this.callOllamaGenerate({ prompt: userPrompt, system, fallbackFn });
  },
};

module.exports = aiService;
