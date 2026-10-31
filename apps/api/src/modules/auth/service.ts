import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { AppError } from '../../errors/AppError.js';
import type { Repository } from '../../db/connection.js';
import type { LawyerRecord, SessionRecord } from '../../types/domain.js';
import { createLawyer, createSession, deleteSession, findByEmail, findById, findSession } from './model.js';

const SESSION_DAYS = 7;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

function verifyPassword(password: string, stored: string): boolean {
  if (stored === 'demo') return true;
  const [salt, digest] = stored.split(':');
  if (!salt || !digest) return false;
  const expected = scryptSync(password, salt, 64);
  const actual = Buffer.from(digest, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function publicLawyer(lawyer: LawyerRecord) {
  const { passwordHash: _passwordHash, ...safeLawyer } = lawyer;
  return safeLawyer;
}

async function issueSession(repository: Repository, lawyer: LawyerRecord): Promise<{ lawyer: ReturnType<typeof publicLawyer>; token: string }> {
  const now = new Date();
  const session: SessionRecord = {
    token: randomBytes(32).toString('hex'),
    lawyerId: lawyer.id,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_DAYS * 86400000).toISOString(),
  };
  await createSession(repository, session);
  return { lawyer: publicLawyer(lawyer), token: session.token };
}

export async function register(repository: Repository, name: string, email: string, password: string) {
  if (!name.trim() || !email.trim() || password.length < 6) {
    throw new AppError(400, 'INVALID_INPUT', 'Name, email, and a password of at least 6 characters are required.');
  }
  if (await findByEmail(repository, email.trim())) {
    throw new AppError(400, 'EMAIL_IN_USE', 'A lawyer with this email already exists.');
  }
  const lawyer: LawyerRecord = {
    id: `lawyer-${randomBytes(8).toString('hex')}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  await createLawyer(repository, lawyer);
  return issueSession(repository, lawyer);
}

export async function login(repository: Repository, email: string, password: string) {
  if (!email.trim() || !password) throw new AppError(400, 'INVALID_INPUT', 'Email and password are required.');
  const lawyer = await findByEmail(repository, email.trim());
  if (!lawyer || !verifyPassword(password, lawyer.passwordHash)) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }
  return issueSession(repository, lawyer);
}

export async function demoLogin(repository: Repository, lawyerId: 'lawyer-1' | 'lawyer-2') {
  const lawyer = await findById(repository, lawyerId);
  if (!lawyer) throw new AppError(404, 'LAWYER_NOT_FOUND', 'Demo lawyer was not found.');
  return issueSession(repository, lawyer);
}

export async function getLawyerByToken(repository: Repository, token: string) {
  const session = await findSession(repository, token);
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
    if (session) await deleteSession(repository, token);
    return null;
  }
  const lawyer = await findById(repository, session.lawyerId);
  return lawyer ? publicLawyer(lawyer) : null;
}

export async function logout(repository: Repository, token: string) {
  await deleteSession(repository, token);
}
