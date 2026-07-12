import { exportEpub } from './export-epub.js';

describe('exportEpub', () => {
  it('should work', () => {
    expect(exportEpub()).toEqual('export-epub');
  });
});
