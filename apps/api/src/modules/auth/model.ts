import type { Repository } from '../../db/connection.js';
import type { LawyerRecord, SessionRecord } from '../../types/domain.js';

export async function findByEmail(repository: Repository, email: string) {
  const workspace = await repository.read();
  return workspace.lawyers.find((lawyer) => lawyer.email.toLowerCase() === email.toLowerCase());
}

export async function findById(repository: Repository, id: string) {
  const workspace = await repository.read();
  return workspace.lawyers.find((lawyer) => lawyer.id === id);
}

export async function createLawyer(repository: Repository, lawyer: LawyerRecord) {
  const workspace = await repository.read();
  workspace.lawyers.push(lawyer);
  await repository.write(workspace);
  return lawyer;
}

export async function createSession(repository: Repository, session: SessionRecord) {
  const workspace = await repository.read();
  workspace.sessions.push(session);
  await repository.write(workspace);
  return session;
}

export async function findSession(repository: Repository, token: string) {
  const workspace = await repository.read();
  return workspace.sessions.find((session) => session.token === token);
}

export async function deleteSession(repository: Repository, token: string) {
  const workspace = await repository.read();
  workspace.sessions = workspace.sessions.filter((session) => session.token !== token);
  await repository.write(workspace);
}
