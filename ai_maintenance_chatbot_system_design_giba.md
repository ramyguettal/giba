# AI-Powered Maintenance Assistant System (GIBA)

## 1. Overview

The goal of this system is to enhance the existing maintenance workflow used by GIBA by introducing an AI-powered chatbot. This chatbot will:

- Assist repairers in diagnosing and solving machine issues.
- Retrieve similar past issues and solutions using semantic search.
- Reformulate poorly written maintenance reports.
- Store structured and enriched reports in a vector database.
- Integrate external manufacturer alerts into the knowledge base.

The system combines:
- Large Language Models (LLMs)
- Vector databases
- Retrieval-Augmented Generation (RAG)
- REST APIs

---

## 2. High-Level Architecture

### Components

1. **Frontend Interface**
   - Chat UI for repairers
   - Report submission form

2. **Backend API Layer**
   - Handles requests from frontend
   - Routes tasks to appropriate services

3. **LLM Service (Claude or equivalent)**
   - Reformulates reports
   - Generates responses
   - Summarizes and structures data

4. **Vector Database**
   - Stores embeddings of reports and alerts
   - Enables semantic similarity search

5. **Embedding Service**
   - Converts text into vector representations

6. **External Manufacturer API Integration**
   - Receives alerts and solutions

---

## 3. Data Flow

### 3.1 Report Submission Flow

⚠️ Important: The repairer does NOT submit a raw/unstructured report.

Instead, the report is collected via a structured form داخل الشات.

#### Steps

1. Repairer triggers `/report` command.
2. A form appears with 3 required fields:
   - Problem
   - Cause
   - Solution
3. Repairer fills the fields directly.

#### LLM Reformulation + User Approval Loop

4. Backend sends fields to LLM for reformulation only.
5. LLM returns improved version:
   - clean_problem
   - clean_cause
   - clean_solution
6. System displays the reformulated report inside the chat UI.

#### User Actions

User must explicitly choose:

- ✅ Approve → proceed to saving
- ✏️ Modify → request changes in natural language

---

#### Modification Flow (In-Chat Editing)

If user wants changes, they can type something like:

- "make the solution shorter"
- "clarify the cause"
- "rewrite problem more technical"

Flow:

1. User sends modification instruction
2. Backend sends:
   - previous clean fields
   - user instruction
   → to LLM
3. LLM updates fields accordingly
4. UI refreshes with new version
5. Loop continues until user approves

---

#### Final Save Flow

Once user approves:

1. Combine cleaned fields into `combined_clean_text`
2. Generate embedding
3. Store in vector DB with metadata

---

### 3.2 Query (Chatbot) Flow

1. Repairer describes issue in chat.
2. System generates embedding of query.
3. Perform similarity search in vector DB.
4. Retrieve top-K similar reports.
5. Send to LLM as context.
6. LLM generates:
   - Suggested diagnosis
   - Recommended solutions
   - References to past cases

---

### 3.3 Manufacturer Alert Flow

1. Manufacturer sends alert via API.
2. Backend receives message.
3. LLM reformulates and structures alert.
4. Generate embedding.
5. Store in vector DB as "trusted knowledge".

---

## 4. Data Model

### Report Schema

```json
{
  "id": "string",
  "problem": "string",
  "cause": "string",
  "solution": "string",
  "clean_problem": "string",
  "clean_cause": "string",
  "clean_solution": "string",
  "combined_clean_text": "string",
  "machine_type": "string",
  "timestamp": "datetime",
  "source": "repairer | manufacturer",
  "embedding": ["vector"]
}
```json
{
  "id": "string",
  "original_text": "string",
  "clean_text": "string",
  "issue": "string",
  "cause": "string",
  "solution": "string",
  "machine_type": "string",
  "timestamp": "datetime",
  "source": "repairer | manufacturer",
  "embedding": ["vector"]
}
```

---

## 5. Vector Database Design

### Requirements

- Fast similarity search
- Metadata filtering
- Scalability

### Suggested Options

- FAISS (local)
- Pinecone (managed)
- Weaviate
- Chroma

### Index Strategy

- Use cosine similarity
- Store embeddings alongside metadata

---

## 6. LLM Responsibilities

### 6.1 Report Reformulation Prompt

⚠️ Input is structured. LLM only improves clarity.

Prompt template:

"""
You are a maintenance expert assistant.

Rewrite the following fields clearly and professionally without changing meaning.

Input:
Problem: {problem}
Cause: {cause}
Solution: {solution}

Return same structure.
"""

---

### 6.2 Report Modification Prompt

Used when user requests edits after seeing reformulated version.

"""
You are a maintenance expert assistant.

You are given a structured report and a user instruction to modify it.

Current report:
Problem: {clean_problem}
Cause: {clean_cause}
Solution: {clean_solution}

User instruction:
{instruction}

Update the fields accordingly while keeping technical correctness.

Return:
Problem: ...
Cause: ...
Solution: ...
"""

---

### 6.2 Chatbot Prompt (RAG)

"""
You are a maintenance assistant.

User issue:
{query}

Relevant past cases:
{retrieved_context}

Provide:
- Diagnosis
- Possible causes
- Suggested solutions
- Reference similar cases
"""

---

## 7. API Design

### 7.1 Submit Report

POST /reports

- Input: raw report
- Output: success status

---

### 7.2 Chat Query

POST /chat

- Input: user query
- Output: AI response

---

### 7.3 Manufacturer Webhook

POST /manufacturer-alert

- Input: alert message
- Output: acknowledgment

---

## 8. Retrieval-Augmented Generation (RAG)

### Steps

1. Embed query
2. Retrieve top-K similar entries
3. Build context window
4. Feed to LLM
5. Generate grounded response

### Best Practices

- Limit context size
- Rank by similarity score
- Include diversity in results

---

## 9. Storage Strategy

### Hybrid Storage

- Vector DB → embeddings
- Relational DB → metadata & raw text

---

## 10. Evaluation Metrics

- Retrieval accuracy
- Response relevance
- Time saved per repair
- User satisfaction

---

## 11. Future Improvements

- Predictive maintenance using time-series data
- Image-based diagnostics
- Voice input support
- Multilingual support

---

## 12. Implementation Notes for Claude

- Use modular architecture
- Separate embedding and generation steps
- Ensure idempotent API endpoints
- Use async processing for LLM calls
- Cache frequent queries

---

## 13. Security, Authentication & Authorization

This system MUST include a strict access control layer to ensure that repairers can only interact with machines they are authorized to handle.

---

### 13.1 Authentication (Login System)

Repairers must authenticate before accessing the chatbot.

#### Options

- JWT-based authentication (recommended)
- OAuth (if integrated with company systems)

#### Flow

1. User logs in with credentials (username/password or SSO).
2. Backend verifies identity.
3. सिस्टम issues JWT token.
4. Token is sent with every request.

---

### 13.2 Authorization (Permission Layer)

Each repairer has a predefined set of allowed machines.

#### Example

```json
{
  "user_id": "123",
  "allowed_machines": ["CNC_01", "PRESS_02"]
}
```

---

### 13.3 Enforcement Points

Authorization must be enforced in ALL flows:

#### A. Report Submission

- When submitting a report, the system must check:
  - Is the machine included in `allowed_machines`?
- If NOT → reject request

#### B. Chat Query (RAG)

- Before retrieval, filter vector DB results by:
  - `machine_type IN allowed_machines`
- This prevents data leakage between repairers

#### C. Manufacturer Alerts

- Alerts are stored globally
- But retrieval is filtered per user permissions

---

### 13.4 Vector DB Filtering Strategy

Each stored record must include:

- `machine_type`

During retrieval:

- Apply metadata filter BEFORE similarity ranking

Example:

```
WHERE machine_type IN user.allowed_machines
```

---

### 13.5 API Security Layer

All endpoints must:

- Require authentication token
- Extract user identity
- Attach permissions to request context

---

### 13.6 Backend Middleware (Concept)

```javascript
function authMiddleware(req) {
  const token = req.headers.authorization;
  const user = verifyToken(token);
  req.user = user;
}

function permissionCheck(machineType, user) {
  return user.allowed_machines.includes(machineType);
}
```

---

### 13.7 UX Considerations

- Machine selection in `/report` form should be LIMITED to allowed machines only
- If user tries unauthorized access → clear error message

---

## 14. Machine Onboarding & Manual Embedding

The system must support automatic ingestion of new machines and their documentation.

### 14.1 Trigger: New Machine Added

Whenever a new machine is added to the system (via admin panel or API), a trigger must execute the following pipeline.

---

### 14.2 Input Data

Each new machine includes:

- machine_id
- machine_type
- manual (PDF, text, or structured document)

---

### 14.3 Processing Pipeline

1. Extract text from manual (PDF/text parsing)
2. Split manual into chunks (chunking strategy required):
   - 300–800 tokens per chunk
   - Overlap: 10–20%

3. For each chunk:
   - Generate embedding
   - Attach metadata:
     - machine_type
     - source = "manual"
     - section (optional)

4. Store all chunks in vector DB

---

### 14.4 Retrieval Integration

During chatbot queries:

- Include manual chunks in retrieval
- Apply same permission filtering:
  machine_type IN user.allowed_machines

This allows the chatbot to:
- Answer using official documentation
- Combine manuals + past reports

---

### 14.5 Storage Schema Extension

Add new source type:

```
source: "repairer" | "manufacturer" | "manual"
```

---

### 14.6 Optional Enhancements

- Tag chunks by section (e.g., "maintenance", "errors")
- Prioritize manual content when confidence is low
- Highlight "official recommendation" in responses

---

## Conclusion

This upgraded design ensures that:

- The chatbot is the **single interface** for all operations
- Repairers interact using **structured input + chat**
- Reports are clean and consistent
- Knowledge base continuously improves
- Access is **secure and strictly controlled per user permissions**

This creates a production-ready, secure AI system for industrial maintenance.

This upgraded design ensures that:

- The chatbot is the **single interface** for all operations
- Repairers interact using **natural chat + slash commands**
- Reports are structured, clean, and automatically stored
- Knowledge base continuously improves

This creates a modern, GPT-like experience tailored for industrial maintenance workflows.

