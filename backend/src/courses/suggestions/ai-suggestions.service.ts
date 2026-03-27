import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SuggestionItem {
  [key: string]: unknown;
  title: string;
  why: string;
  actions: string[];
  expectedImpact?: string;
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
  ): Promise<SuggestionItem[]> {
    const apiKey = this.configService.get<string>('OPENAI_KEY');
    if (!apiKey) {
      return this.templateSuggestions(reasons, weightedPercent);
    }

    try {
      const prompt = this.buildPrompt(courseTitle, reasons, weightedPercent, context);

      const { data } = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          temperature: 0.1,
          messages: [
            {
              role: 'system',
              content:
                'You are an academic advisor assistant. Return strictly valid JSON array only, no markdown.',
            },
            { role: 'user', content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10_000,
        },
      );

      const rawText = String(data?.choices?.[0]?.message?.content ?? '[]');
      const parsed = this.parseSuggestionsJson(rawText);
      if (parsed.length === 0) {
        return this.templateSuggestions(reasons, weightedPercent);
      }
      return parsed;
    } catch {
      return this.templateSuggestions(reasons, weightedPercent);
    }
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
      'Each item must include: title (short), why (specific), actions (2-4 concrete actions), expectedImpact.',
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

      if (!title || !why || actions.length === 0) continue;
      normalized.push({ title, why, actions, expectedImpact });
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
      });
    }

    return suggestions.slice(0, 6);
  }
}
