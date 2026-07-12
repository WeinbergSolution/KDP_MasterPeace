import { exportDocx } from './export-docx.js';

describe('exportDocx', () => {
  it('should work', () => {
    expect(exportDocx()).toEqual('export-docx');
  });
});
