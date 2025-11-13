# Document AI

A RAG (Retrieval Augmented Generation) application for document Q&A. Upload PDFs, search content, and get AI-powered answers with source citations.

## Tech Stack

- **Backend**: FastAPI, PostgreSQL with pgvector, OpenAI/Google GenAI
- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, Radix UI
- **Database**: PostgreSQL 17 with pgvector extension

## Prerequisites

- Python 3.11+
- Node.js 18+ and pnpm
- Docker and Docker Compose

## Setup

1. **Start the database**:
   ```bash
   docker compose up -d
   ```

2. **Backend setup**:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend setup**:
   ```bash
   cd frontend
   pnpm install
   ```

4. **Environment variables**:
   Create a `.env` file in the backend directory with:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aidocs
   OPENAI_API_KEY=your_key_here
   # or
   GOOGLE_API_KEY=your_key_here
   EMBEDDING_DIM=1536
   ```

## Running

1. **Start the database** (if not already running):
   ```bash
   docker compose up -d
   ```

2. **Start the backend**:
   ```bash
   cd backend
   source .venv/bin/activate
   uvicorn app.main:app --reload
   ```

3. **Start the frontend**:
   ```bash
   cd frontend
   pnpm dev
   ```

Visit `http://localhost:3000` to use the application.

## Features

- 📄 Upload PDF documents
- 🔍 Semantic search across document chunks
- 💬 Ask questions and get AI-generated answers with source citations
- 📚 View and manage uploaded documents

## API Endpoints

- `POST /ingest_pdf` - Upload a PDF document
- `POST /search` - Search document chunks
- `POST /ask` - Ask a question and get an AI answer
- `GET /documents` - List all documents
- `DELETE /documents/{id}` - Delete a document

