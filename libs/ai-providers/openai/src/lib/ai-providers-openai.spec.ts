import { aiProvidersOpenai } from './ai-providers-openai.js';

describe('aiProvidersOpenai', () => {
  it('should work', () => {
    expect(aiProvidersOpenai()).toEqual('ai-providers-openai');
  });
});
