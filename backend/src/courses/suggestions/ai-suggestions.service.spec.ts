import { describe, expect, it } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { AiSuggestionsService } from './ai-suggestions.service';

describe('AiSuggestionsService', () => {
  it('returns template suggestions without OPENAI_KEY', async () => {
    const service = new AiSuggestionsService(new ConfigService({}));

    const suggestions = await service.generate(
      'Math 101',
      ['Weighted score currently below 50%', 'Absence level is critical (25+)'],
      42,
    );

    expect(suggestions.length).toBeGreaterThanOrEqual(3);
    expect(suggestions[0]).toHaveProperty('title');
    expect(suggestions[0]).toHaveProperty('actions');
  });
});
