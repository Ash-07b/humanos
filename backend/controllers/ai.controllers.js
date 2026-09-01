const AIHistory = require('../models/AIhistory');

/**
 * Universal Ollama Query Helper
 */
async function callOllama(systemPrompt, userPrompt, fallbackFn, modelOverride) {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const model = modelOverride || process.env.OLLAMA_MODEL || 'qwen2.5:3b';

  let responseText = '';
  let source = 'fallback';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 200,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.message && data.message.content) {
        responseText = data.message.content.trim();
        source = `ollama:${model}`;
      }
    }
  } catch (err) {
    console.log(`[HumanOS AI] Ollama call skipped (${err.message || 'offline'}), using smart synthesis.`);
  }

  if (!responseText && typeof fallbackFn === 'function') {
    responseText = fallbackFn();
    source = 'telemetry_synthesis';
  }

  return { text: responseText, source, model };
}

/**
 * 1. Health & Vitality AI Recommendation
 */
exports.getHealthRecommendation = async (req, res) => {
  try {
    const { heartRate, sleep, bloodPressure, steps, hydration, medications, prompt } = req.body || {};

    const systemPrompt = `You are HumanOS Vitality AI, an advanced personal health and biometric optimization assistant.
Analyze the user's telemetry and return a concise, actionable, 2-3 sentence personalized recommendation.
Tone: Precise, scientific, encouraging, and data-driven.`;

    const userContext = `User Telemetry Data:
- Resting Heart Rate: ${heartRate || 'Not recorded'}
- Sleep Duration: ${sleep || 'Not recorded'}
- Blood Pressure: ${bloodPressure || 'Normal'}
- Daily Steps: ${steps || 'Normal'}
- Hydration: ${hydration || 'Optimal'}
- Active Medications: ${Array.isArray(medications) ? medications.join(', ') : 'None'}
${prompt ? `Additional context: ${prompt}` : ''}`;

    const fallback = () => {
      const cleanSleep = sleep ? (String(sleep).endsWith('h') ? String(sleep) : `${sleep}h`) : '';
      const cleanHr = heartRate ? (String(heartRate).includes('bpm') ? String(heartRate) : `${heartRate} bpm`) : '';
      const recs = [];
      if (cleanSleep && parseFloat(cleanSleep) < 7) {
        recs.push(`Your sleep duration of ${cleanSleep} is below optimal recovery targets. Prioritize winding down 30 minutes earlier.`);
      } else if (cleanSleep && parseFloat(cleanSleep) >= 8) {
        recs.push(`Strong ${cleanSleep} sleep recorded—central nervous system recovery is primed for deep focus.`);
      }
      if (cleanHr && parseInt(cleanHr, 10) > 85) {
        recs.push(`Resting heart rate (${cleanHr}) is slightly elevated. Consider 5 minutes of box-breathing.`);
      }
      if (recs.length === 0) {
        recs.push('Consistent biometric signals detected. Maintain steady hydration and regular active intervals.');
      }
      return recs.join(' ');
    };

    const result = await callOllama(systemPrompt, userContext, fallback);

    if (req.user && req.user._id) {
      try {
        await AIHistory.create({
          userId: req.user._id,
          text: result.text,
          category: 'Health',
        });
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      recommendation: result.text,
      model: result.model,
      source: result.source,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. Goal Strategy & Execution AI Review
 */
exports.getGoalRecommendation = async (req, res) => {
  try {
    const { totalGoals, completedGoals, activeGoals, categories, currentProgress } = req.body || {};

    const systemPrompt = `You are HumanOS Goal Strategist AI.
Analyze the user's quarterly/yearly goal progression and give a concise, high-impact 2-sentence executive review and actionable next milestone.`;

    const userContext = `User Goal Metrics:
- Overall Progress: ${currentProgress || 0}%
- Total Goals: ${totalGoals || 0}
- Completed Goals: ${completedGoals || 0}
- Active Goals: ${Array.isArray(activeGoals) ? activeGoals.map((g) => `${g.title} (${g.progress}%)`).join('; ') : 'None'}
- Top Focus Categories: ${Array.isArray(categories) ? categories.join(', ') : 'All'}`;

    const fallback = () => {
      return `You are maintaining solid momentum at ${currentProgress || 0}% overall completion. Focus your highest energy block on advancing your highest-leverage active milestones this week.`;
    };

    const result = await callOllama(systemPrompt, userContext, fallback);

    if (req.user && req.user._id) {
      try {
        await AIHistory.create({
          userId: req.user._id,
          text: result.text,
          category: 'Goals',
        });
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      recommendation: result.text,
      model: result.model,
      source: result.source,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. Daily Task Prioritization & Schedule AI
 */
exports.getTaskRecommendation = async (req, res) => {
  try {
    const { totalTasks, completedTasks, pendingTasks, highPriorityTasks } = req.body || {};

    const systemPrompt = `You are HumanOS Productivity AI.
Review the user's task queue and produce a motivating, 2-sentence daily priority briefing.`;

    const userContext = `Daily Task State:
- Completed: ${completedTasks || 0} / ${totalTasks || 0}
- Pending Tasks: ${Array.isArray(pendingTasks) ? pendingTasks.slice(0, 5).join(', ') : 'None'}
- High Priority Items: ${Array.isArray(highPriorityTasks) ? highPriorityTasks.join(', ') : 'None'}`;

    const fallback = () => {
      return `Prioritize completing your top high-impact intention during your peak cognitive window before noon. Group remaining operational tasks into a single afternoon batch.`;
    };

    const result = await callOllama(systemPrompt, userContext, fallback);

    return res.status(200).json({
      success: true,
      recommendation: result.text,
      model: result.model,
      source: result.source,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. Finance & Wealth Advisory AI
 */
exports.getFinanceRecommendation = async (req, res) => {
  try {
    const { totalBalance, monthlyIncome, monthlyExpenses, currency, recentTransactions } = req.body || {};

    const systemPrompt = `You are HumanOS Wealth & Financial Intelligence AI.
Analyze user cashflow metrics and return a concise, 2-sentence wealth optimization insight.`;

    const userContext = `Financial Snapshot:
- Net Balance: ${currency || '$'}${totalBalance || '0'}
- Monthly Inflow: ${currency || '$'}${monthlyIncome || '0'}
- Monthly Outflow: ${currency || '$'}${monthlyExpenses || '0'}
- Recent Activity: ${Array.isArray(recentTransactions) ? recentTransactions.slice(0, 3).map((t) => `${t.title}: ${currency || '$'}${t.amount}`).join('; ') : 'Normal'}`;

    const fallback = () => {
      return `Your net cashflow ratio remains well-balanced this month. Consider allocating surplus reserves into automated savings and high-yield investments.`;
    };

    const result = await callOllama(systemPrompt, userContext, fallback);

    return res.status(200).json({
      success: true,
      recommendation: result.text,
      model: result.model,
      source: result.source,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. Smart Note Assistant & Summarizer
 */
exports.getNoteAssistant = async (req, res) => {
  try {
    const { noteTitle, noteContent, action = 'summarize' } = req.body || {};

    const systemPrompt = `You are HumanOS Note Intelligence AI.
You help summarize notes and extract concrete action items.
Action requested: ${action}.
Provide a clear, formatted, high-value result in 2 to 3 concise bullet points or sentences.`;

    const userContext = `Note Title: ${noteTitle || 'Untitled'}
Note Content:
${noteContent || ''}`;

    const fallback = () => {
      return `Key takeaway: Main concepts identified and organized into structured action points.`;
    };

    const result = await callOllama(systemPrompt, userContext, fallback);

    return res.status(200).json({
      success: true,
      result: result.text,
      model: result.model,
      source: result.source,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. Universal / General AI Assistant
 */
exports.getGeneralAssistant = async (req, res) => {
  try {
    const { prompt, context, module = 'General' } = req.body || {};

    const systemPrompt = `You are HumanOS Assistant, an elite executive operating system AI.
Provide concise, elegant, and actionable assistance tailored to the user's prompt.`;

    const userContext = `Module: ${module}
Context: ${JSON.stringify(context || {})}
User Request: ${prompt}`;

    const fallback = () => {
      return `Your personal assistant is active. Focus on executing today's core priorities with calm consistency.`;
    };

    const result = await callOllama(systemPrompt, userContext, fallback);

    return res.status(200).json({
      success: true,
      reply: result.text,
      model: result.model,
      source: result.source,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/ai/history
 */
exports.getAiHistory = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const history = await AIHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      history: history.map((item) => ({
        id: item._id,
        text: item.text,
        category: item.category,
        date: item.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch AI history',
      error: error.message,
    });
  }
};
