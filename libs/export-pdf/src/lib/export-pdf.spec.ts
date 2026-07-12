import { exportPdf } from './export-pdf.js';

describe('exportPdf', () => {
  it('should work', () => {
    expect(exportPdf()).toEqual('export-pdf');
  });
});
