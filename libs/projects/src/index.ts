export { ProjectService, type VersionLabel } from './lib/project-service.js';
export {
  type ProjectVersionRepository,
  InMemoryProjectVersionRepository,
} from './lib/project-repository.js';
export {
  type StoredProjectVersion,
  VersionConflictError,
  computeAstHash,
  etagForVersion,
} from './lib/project-version.js';
export {
  type NewProject,
  type StoredProject,
  type ProjectStore,
} from './lib/project-store.js';
export {
  PersistenceError,
  TenantIsolationError,
} from './lib/persistence-error.js';
