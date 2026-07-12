export {
  TRIMS,
  PAPER_THICKNESS_INCH_PER_PAGE,
  GUTTER_MM,
  BLEED_MM,
  SAFE_MM,
  BARCODE_SIZE_MM,
  SPINE_TEXT_MIN_PAGES,
  spineWidthMm,
  coverDimensions,
  type TrimKey,
  type PaperKey,
  type GutterKey,
  type TrimSize,
  type CoverDimensions,
} from './lib/kdp-specs.js';

export {
  WORDS_PER_PAGE,
  PAGES_PER_CHAPTER,
  FRONT_BACK_MATTER_PAGES,
  estimatePageCount,
} from './lib/page-estimator.js';

export {
  estimateStepCostCents,
  type StepTokenEstimate,
  type ModelPricing,
  type CostEstimateCents,
} from './lib/cost-estimator.js';
