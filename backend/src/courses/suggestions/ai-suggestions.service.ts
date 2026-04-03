import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SuggestionItem {
  [key: string]: unknown;
  title: string;
  why: string;
  actions: string[];
  expectedImpact?: string;
  dataSources?: string[];
}

export type AiSuggestionStatus = 'ai' | 'fallback_no_key' | 'fallback_error' | 'fallback_invalid_json';

export interface SuggestionGenerationResult {
  suggestions: SuggestionItem[];
  status: AiSuggestionStatus;
  message: string;
}

export interface SuggestionsContext {
  probabilityFail?: number;
  bucket?: string;
  totalAbsences?: number;
  missingWeeksCount?: number;
  remainingWeight?: number;
  maxAchievablePercent?: number;
  canStillPass?: boolean;
  currentWeek?: number;
}

@Injectable()
export class AiSuggestionsService {
  constructor(private readonly configService: ConfigService) {}

  async generate(
    courseTitle: string,
    reasons: string[],
    weightedPercent: number,
    context?: SuggestionsContext,
  ): Promise<SuggestionGenerationResult> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      return {
        suggestions: this.templateSuggestions(reasons, weightedPercent),
        status: 'fallback_no_key',
        message: 'GEMINI_API_KEY is missing. Using fallback suggestions.',
      };
    }

    const preferredModel = this.configService.get<string>('GEMINI_MODEL')?.trim() || 'gemini-1.5-flash';
    const candidateModels = Array.from(new Set([preferredModel, 'gemini-1.5-flash', 'gemini-1.5-pro']));

    let lastErrorDetail = 'Unknown Gemini error';

    for (const model of candidateModels) {
      try {
        const prompt = this.buildPrompt(courseTitle, reasons, weightedPercent, context);

        const requestBody = {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
          systemInstruction: {
            role: 'system',
            parts: [
              {
                text: 'You are an academic advisor assistant. Return strictly valid JSON array only, no markdown.',
              },
            ],
          },
        };

        const { data } = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 15_000,
          },
        );

        const rawText = String(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]');
        const parsed = this.parseSuggestionsJson(rawText);
        if (parsed.length === 0) {
          return {
            suggestions: this.templateSuggestions(reasons, weightedPercent),
            status: 'fallback_invalid_json',
            message: `AI response invalid JSON (model=${model}). Using fallback suggestions.`,
          };
        }
        return {
          suggestions: parsed,
          status: 'ai',
          message: `AI suggestions generated successfully (model=${model}).`,
        };
      } catch (error) {
        const detail = this.formatAxiosError(error);
        lastErrorDetail = detail;

        // If only the model is unavailable, try next model candidate.
        if (detail.includes('model') || detail.includes('404')) {
          continue;
        }

        break;
      }
    }

    console.warn(`[ai-suggestions] Gemini request failed: ${lastErrorDetail}`);
    return {
      suggestions: this.templateSuggestions(reasons, weightedPercent),
      status: 'fallback_error',
      message: `AI request failed: ${lastErrorDetail}. Using fallback suggestions.`,
    };
  }

  private formatAxiosError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data as
        | {
            error?: {
              message?: string;
              type?: string;
              code?: string;
              status?: string;
            };
          }
        | undefined;
      const code = data?.error?.code ?? error.code;
      const type = data?.error?.type ?? data?.error?.status;
      const message = data?.error?.message ?? error.message;
      const statusText = status ? `status=${status}` : 'status=n/a';
      return `${statusText}; code=${code ?? 'n/a'}; type=${type ?? 'n/a'}; message=${message ?? 'unknown'}`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }

  private buildPrompt(
    courseTitle: string,
    reasons: string[],
    weightedPercent: number,
    context?: SuggestionsContext,
  ): string {
    const safeReasons = reasons.length ? reasons.join('; ') : 'No explicit reasons';
    return [
      'Generate 3-6 personalized student success suggestions as a JSON array.',
      'Each item must include: title (short), why (specific), actions (2-4 concrete actions), expectedImpact, dataSources.',
      'dataSources must be an array with 1-3 metrics names from this list when relevant: weightedPercent, probabilityFail, bucket, currentWeek, totalAbsences, missingWeeksCount, remainingWeight, maxAchievablePercent, canStillPass, reasons.',
      'Actions must be actionable this week and tied to provided metrics.',
      '',
      `Course: ${courseTitle}`,
      `Weighted score: ${weightedPercent.toFixed(2)}%`,
      `Risk probability: ${Math.round((context?.probabilityFail ?? 0) * 100)}%`,
      `Risk bucket: ${context?.bucket ?? 'unknown'}`,
      `Current week: ${context?.currentWeek ?? 0}`,
      `Total absences: ${context?.totalAbsences ?? 0}`,
      `Missing weeks count: ${context?.missingWeeksCount ?? 0}`,
      `Remaining weight: ${context?.remainingWeight?.toFixed(2) ?? '0.00'}%`,
      `Max achievable percent: ${context?.maxAchievablePercent?.toFixed(2) ?? '0.00'}%`,
      `Can still pass: ${context?.canStillPass ? 'yes' : 'no'}`,
      `Reasons: ${safeReasons}`,
      '',
      'Return JSON array only. No text before/after JSON.',
    ].join('\n');
  }

  private parseSuggestionsJson(raw: string): SuggestionItem[] {
    let text = raw.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return [];
    }

    if (!Array.isArray(parsed)) return [];

    const normalized: SuggestionItem[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      const title = typeof row.title === 'string' ? row.title.trim() : '';
      const why = typeof row.why === 'string' ? row.why.trim() : '';
      const actionsRaw = Array.isArray(row.actions) ? row.actions : [];
      const actions = actionsRaw
        .map((a) => (typeof a === 'string' ? a.trim() : ''))
        .filter((a) => a.length > 0)
        .slice(0, 4);
      const expectedImpact =
        typeof row.expectedImpact === 'string' && row.expectedImpact.trim().length > 0
          ? row.expectedImpact.trim()
          : undefined;
      const dataSourcesRaw = Array.isArray(row.dataSources) ? row.dataSources : [];
      const dataSources = dataSourcesRaw
        .map((source) => (typeof source === 'string' ? source.trim() : ''))
        .filter((source) => source.length > 0)
        .slice(0, 3);

      if (!title || !why || actions.length === 0) continue;
      normalized.push({ title, why, actions, expectedImpact, dataSources });
    }

    return normalized.slice(0, 6);
  }

  // Template fallback keeps the feature deterministic when LLM is unavailable.
  templateSuggestions(reasons: string[], weightedPercent: number): SuggestionItem[] {
    const suggestions: SuggestionItem[] = [];
    const reasonText = reasons.join(' ').toLowerCase();

    if (reasonText.includes('midterm') || weightedPercent < 50) {
      suggestions.push({
        title: 'Focus on exam-style practice',
        why: 'Current exam performance is a major pass/fail driver.',
        actions: [
          'Solve 15-20 timed exam problems each week',
          'Review errors and build a correction log',
          'Attend office hour for weak topics',
        ],
        expectedImpact: 'Can improve exam component confidence by 10-20 points.',
        dataSources: ['weightedPercent', 'reasons'],
      });
    }

    if (reasonText.includes('quiz') || reasonText.includes('trend')) {
      suggestions.push({
        title: 'Stabilize weekly quiz consistency',
        why: 'Quiz trend indicates unstable weekly understanding.',
        actions: [
          'Complete short practice sets 3 times per week',
          'Use a fixed weekly revision window',
          'Track quiz score trend week-by-week',
        ],
        expectedImpact: 'Improves continuous assessment trajectory and reduces volatility.',
        dataSources: ['reasons', 'currentWeek'],
      });
    }

    if (reasonText.includes('remaining weight') || reasonText.includes('passing grade')) {
      suggestions.push({
        title: 'Maximize remaining high-weight assessments',
        why: 'Recovery margin is narrow and depends on pending weighted components.',
        actions: [
          'Prioritize highest-weight pending component first',
          'Create a 2-week intensive revision plan',
          'Set target score milestones before submission',
        ],
        expectedImpact: 'Improves probability of staying above the 50% threshold.',
        dataSources: ['remainingWeight', 'maxAchievablePercent', 'canStillPass'],
      });
    }

    if (reasonText.includes('absence')) {
      suggestions.push({
        title: 'Adopt attendance recovery plan',
        why: 'Absence count is a hard risk accelerator and can trigger auto-fail.',
        actions: [
          'Block lecture times in calendar as non-negotiable',
          'Use accountability check-ins with advisor',
          'Document missed material within 24 hours',
        ],
        expectedImpact: 'Reduces hard-rule failure risk from attendance breaches.',
        dataSources: ['totalAbsences', 'reasons'],
      });
    }

    if (suggestions.length < 3) {
      suggestions.push({
        title: 'Structured weekly study cadence',
        why: 'Consistent cadence reduces missing weeks and improves weighted outcomes.',
        actions: [
          'Plan weekly goals every Monday',
          'Reserve fixed deep-work sessions',
          'Submit at least one graded activity per week',
        ],
        expectedImpact: 'Improves completion ratio and risk stability.',
        dataSources: ['currentWeek', 'missingWeeksCount', 'weightedPercent'],
      });
    }

    return suggestions.slice(0, 6);
  }
}
