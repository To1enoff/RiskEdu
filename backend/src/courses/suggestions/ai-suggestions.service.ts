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

@Injectable()
export class AiSuggestionsService {
  constructor(private readonly configService: ConfigService) {}

  async generate(courseTitle: string, reasons: string[], weightedPercent: number): Promise<SuggestionItem[]> {
    const apiKey = this.configService.get<string>('OPENAI_KEY');
    if (!apiKey) {
      return this.templateSuggestions(reasons, weightedPercent);
    }

    try {
      const prompt = [
        'Generate 3-6 concise student success suggestions in JSON array format.',
        `Course: ${courseTitle}`,
        `Weighted score: ${weightedPercent.toFixed(2)}%`,
        `Reasons: ${reasons.join('; ')}`,
        'Each item must include: title, why, actions (array), expectedImpact.',
      ].join('\n');

      const { data } = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content:
                'You are an academic advisor assistant. Return only valid JSON. No markdown wrapper.',
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
      const parsed = JSON.parse(rawText) as SuggestionItem[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return this.templateSuggestions(reasons, weightedPercent);
      }
      return parsed.slice(0, 6);
    } catch {
      return this.templateSuggestions(reasons, weightedPercent);
    }
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
