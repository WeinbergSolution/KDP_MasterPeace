// Project creation/lookup port (data-model.md §2). Kept ORM-free in libs/projects
// so the domain never depends on Prisma (ADR-0003); server adapters live in a
// platform:server lib. Adapters are organization-scoped for tenant isolation.

/** Input for creating a new project (the id is generated when omitted). */
export interface NewProject {
  readonly id?: string;
  readonly name: string;
  readonly contentLocale: string;
  readonly marketLocale: string;
  readonly demoMode?: boolean;
}

/** A persisted project, always bound to an owning organization. */
export interface StoredProject {
  readonly id: string;
  readonly orgId: string;
  readonly name: string;
  readonly contentLocale: string;
  readonly marketLocale: string;
  readonly demoMode: boolean;
}

/** Port for creating and reading projects within one organization scope. */
export interface ProjectStore {
  createProject(input: NewProject): Promise<StoredProject>;
  getProject(projectId: string): Promise<StoredProject | null>;
}
