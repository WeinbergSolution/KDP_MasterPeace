import { aiProvidersAnthropic } from './ai-providers-anthropic.js';

describe('aiProvidersAnthropic', () => {
  it('should work', () => {
    expect(aiProvidersAnthropic()).toEqual('ai-providers-anthropic');
  });
});
