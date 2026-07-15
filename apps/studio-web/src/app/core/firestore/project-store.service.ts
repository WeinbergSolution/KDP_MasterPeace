import { Injectable, inject } from '@angular/core';
import {
  type CollectionReference,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { FIRESTORE } from '../firebase/firebase-app';
import { AuthService } from '../firebase/auth.service';
import {
  type BookProject,
  createEmptyProject,
  normalizeProject,
} from '../models/book-project';

// Per-user project persistence in Firestore. Every read/write is scoped to the
// signed-in uid; security rules enforce the same boundary server-side.

/** Firestore-backed CRUD for the current user's book projects. */
@Injectable({ providedIn: 'root' })
export class ProjectStore {
  private readonly db = inject(FIRESTORE);
  private readonly auth = inject(AuthService);

  /**
   * Returns the signed-in user's uid.
   *
   * @returns The current uid.
   * @throws When no user is signed in.
   */
  private requireUid(): string {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) throw new Error('Nicht angemeldet.');
    return uid;
  }

  /**
   * Returns the current user's project collection reference.
   *
   * @returns The typed projects collection.
   */
  private projectsCol(): CollectionReference {
    return collection(this.db, 'users', this.requireUid(), 'projects');
  }

  /**
   * Lists the user's projects, newest first.
   *
   * @returns The normalized projects.
   */
  async list(): Promise<BookProject[]> {
    const snap = await getDocs(
      query(this.projectsCol(), orderBy('updatedAt', 'desc')),
    );
    return snap.docs.map((d) => normalizeProject(d.id, d.data()));
  }

  /**
   * Loads a single project by id.
   *
   * @param id The project id.
   * @returns The project, or null when it does not exist.
   */
  async get(id: string): Promise<BookProject | null> {
    const snap = await getDoc(doc(this.projectsCol(), id));
    return snap.exists() ? normalizeProject(snap.id, snap.data()) : null;
  }

  /**
   * Creates a new project with the given title.
   *
   * @param title The initial project title.
   * @returns The created project (with generated id).
   */
  async create(title: string): Promise<BookProject> {
    const uid = this.requireUid();
    const ref = doc(this.projectsCol());
    const payload = createEmptyProject(uid, title);
    await setDoc(ref, payload);
    return { ...payload, id: ref.id };
  }

  /**
   * Merges a partial update into a project and bumps its timestamp/version.
   *
   * @param id The project id.
   * @param patch The fields to change.
   */
  async update(id: string, patch: Partial<BookProject>): Promise<void> {
    const data = { ...patch, updatedAt: Date.now() };
    await setDoc(doc(this.projectsCol(), id), data, { merge: true });
  }

  /**
   * Deletes a project permanently.
   *
   * @param id The project id.
   */
  async remove(id: string): Promise<void> {
    await deleteDoc(doc(this.projectsCol(), id));
  }
}
