// src/services/auditLog.ts

import { DatabaseService } from './database'  // hypothetical internal DB layer
import type { Document } from './types'

// Interface for log entry
export interface AuditLogEntry {
  id: string
  projectId: string
  collectionId: string
  documentId: string
  timestamp: Date
  userId?: string
  before: Record<string, any> | null
  after: Record<string, any> | null
}

// Function to record a change
export async function recordChange(
  projectId: string,
  collectionId: string,
  documentId: string,
  before: Record<string, any> | null,
  after: Record<string, any> | null,
  userId?: string
): Promise<void> {
  // If no real change, skip
  if (before !== null && after !== null && deepEqual(before, after)) {
    return
  }

  await DatabaseService.insert('audit_logs', {
    project_id: projectId,
    collection_id: collectionId,
    document_id: documentId,
    changed_at: new Date().toISOString(),
    user_id: userId || null,
    before_data: before ? JSON.stringify(before) : null,
    after_data: after ? JSON.stringify(after) : null,
  })
}

// Wrap document update to include audit
export async function updateDocumentWithAudit(
  projectId: string,
  collectionId: string,
  documentId: string,
  data: Record<string, any>,
  userId?: string
): Promise<Document> {
  // Fetch existing doc
  const before = await DatabaseService.getDocument(projectId, collectionId, documentId)
  // Update
  const updated = await DatabaseService.updateDocument(projectId, collectionId, documentId, data)
  // Log
  await recordChange(projectId, collectionId, documentId, before, updated, userId)
  return updated
}
