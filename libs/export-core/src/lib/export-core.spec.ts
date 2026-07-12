import { exportCore } from './export-core.js';

describe('exportCore', () => {
  it('should work', () => {
    expect(exportCore()).toEqual('export-core');
  });
});
