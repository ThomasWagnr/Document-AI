// API client for FastAPI backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ChunkOut {
  id: number
  document_id: number
  document_name?: string | null
  content: string
}

export interface QAResponse {
  answer: string
  context: ChunkOut[]
}

export interface SearchRequest {
  query: string
  k?: number
}

export interface QARequest {
  query: string
  k?: number
}

export interface IngestResponse {
  id: number
  name: string
}

export interface DocumentOut {
  id: number
  name: string
  source: string
}

/**
 * Fetch list of uploaded documents
 */
export async function getDocuments(): Promise<DocumentOut[]> {
  const response = await fetch(`${API_BASE_URL}/documents`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch documents: ${error}`)
  }

  return response.json()
}

/**
 * Ask a question and get an AI-generated answer with context
 */
export async function askQuestion(query: string, k: number = 5): Promise<QAResponse> {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, k }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to ask question: ${error}`)
  }

  return response.json()
}

/**
 * Search for document chunks
 */
export async function searchChunks(query: string, k: number = 5): Promise<ChunkOut[]> {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, k }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to search chunks: ${error}`)
  }

  return response.json()
}

/**
 * Upload a PDF file to the backend
 */
export async function uploadDocument(file: File): Promise<IngestResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/ingest_pdf`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload document: ${error}`)
  }

  return response.json()
}

/**
 * Delete a document and all its chunks from the database
 */
export async function deleteDocument(documentId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to delete document: ${error}`)
  }
}

