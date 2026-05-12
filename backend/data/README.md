# Machine Issues Dataset - Implementation Guide

## 📋 Overview

This package contains a comprehensive dataset of machine issues, causes, and solutions extracted from the **Husky HyPET5e/HPP5e Injection Molding Machine Manual** and community sources. The dataset is designed to populate your Vector Database for your AI Maintenance Chatbot System (GIBA).

## 📁 Files Included

### Data Files
- **`machine_issues.json`** - Main dataset containing 21 problem-solution pairs
- **`DATASET_SUMMARY.md`** - Detailed report about the dataset

### Scripts & Tools
- **`extract_machine_issues.py`** - Original extraction script (can scrape web sources)
- **`extract_machine_issues_enhanced.py`** - Enhanced script for PDF processing
- **`create_machine_issues_dataset.py`** - Fast generation script
- **`machine_issues_service.py`** - Python service class for loading and querying the dataset

## 📊 Dataset Structure

### JSON Format
```json
[
  {
    "problem": "Issue description",
    "cause": "Root cause explanation",
    "solution": "Recommended solution steps",
    "machine_type": "HyPET5e",
    "source": "manuals|community_knowledge",
    "manufacturer": "Husky Injection Molding Systems Limited",
    "manual_language": "French",
    "url": "https://reference-link.com",
    "category": "mechanical|thermal|electrical|hydraulic|safety"
  }
]
```

### Field Descriptions

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `problem` | string | Clear description of the issue | ✓ |
| `cause` | string | Root cause or contributing factors | ✓ |
| `solution` | string | Step-by-step troubleshooting guide | ✓ |
| `machine_type` | string | Type of machine (e.g., HyPET5e) | ✓ |
| `source` | string | Where the info came from (manuals/community_knowledge) | ✓ |
| `manufacturer` | string | Machine manufacturer name | Optional |
| `manual_language` | string | Language of source manual | Optional |
| `url` | string | Reference link to manufacturer or community source | Optional |
| `category` | string | Issue category for filtering | Optional |

## 🚀 Getting Started

### 1. Load the Dataset

#### Python Service Class
```python
from app.services.machine_issues_service import MachineIssuesDatabase

# Initialize
db = MachineIssuesDatabase()

# Get all issues
all_issues = db.get_all_issues()

# Print summary
db.print_summary()
```

#### Direct JSON Loading
```python
import json

with open('backend/data/machine_issues.json', 'r', encoding='utf-8') as f:
    issues = json.load(f)
```

### 2. Query the Database

```python
# Search by keyword
temp_issues = db.search_by_keyword('temperature', field='all')

# Filter by source
manual_issues = db.get_by_source('manuals')
community_issues = db.get_by_source('community_knowledge')

# Filter by machine type
hypet_issues = db.get_by_machine_type('HyPET5e')

# Filter by category
electrical_issues = db.get_by_category('electrical')

# Get statistics
stats = db.get_statistics()
```

### 3. Prepare for Vector Embedding

```python
# Get texts suitable for embedding
embedding_texts = db.get_embedding_texts()

# Each text combines problem + cause + solution
# Example: "La machine n'accepte pas les commandes ou ne démarre pas. 
#           Cause: Problème d'alimentation électrique... 
#           Solution: Vérifier les connexions..."

# Get with metadata (for storing in vector DB)
issues_with_metadata = db.get_issues_with_metadata()
```

## 🔌 Integration with GIBA Backend

### Step 1: Create Data Ingestion Service

```python
# In: app/services/ingestion_service.py

from app.services.machine_issues_service import MachineIssuesDatabase
from app.services.embedding_service import EmbeddingService
from app.repositories.vector_document_repository import VectorDocumentRepository

async def ingest_machine_issues():
    """Ingest machine issues into vector database."""
    
    # Load issues
    db = MachineIssuesDatabase()
    issues = db.get_all_issues()
    
    # Generate embeddings
    embedding_service = EmbeddingService()
    vector_repo = VectorDocumentRepository()
    
    for issue in issues:
        # Create embedding text
        text = f"{issue.problem}\n{issue.cause}\n{issue.solution}"
        
        # Generate embedding
        embedding = await embedding_service.embed(text)
        
        # Store in vector database with metadata
        await vector_repo.create_vector_document(
            content=text,
            embedding=embedding,
            metadata={
                'machine_type': issue.machine_type,
                'source': issue.source,
                'problem': issue.problem,
                'category': issue.category,
                'manufacturer': issue.manufacturer,
            }
        )
```

### Step 2: Create Chat Service Integration

```python
# In: app/services/chat_service.py

async def get_solution(user_query: str, machine_type: str):
    """Find relevant solution for user query."""
    
    # Perform semantic search in vector DB
    results = await rag_service.search_similar(
        query=user_query,
        machine_type=machine_type,
        top_k=3
    )
    
    # Rank and format results
    for result in results:
        problem = result.metadata.get('problem')
        source = result.metadata.get('source')
        
        # Generate response using LLM
        response = await genai_service.generate_solution(
            user_query=user_query,
            context=result.content,
            metadata=result.metadata
        )
        
        return response
```

### Step 3: Create API Endpoint

```python
# In: app/routers/chat.py

from fastapi import APIRouter, Depends
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/query")
async def query_machine_issue(
    request: ChatRequest,
    user: User = Depends(get_current_user)
):
    """Query for machine troubleshooting solution."""
    
    # Check permissions
    if request.machine_type not in user.allowed_machines:
        raise HTTPException(status_code=403, detail="Not authorized for this machine")
    
    # Get solution from chat service
    solution = await chat_service.get_solution(
        user_query=request.query,
        machine_type=request.machine_type
    )
    
    return ChatResponse(
        response=solution,
        sources=solution.get('sources'),
        confidence=solution.get('confidence')
    )
```

## 📈 Dataset Statistics

```
Total Issues: 21

By Source:
  - manuals: 10 issues (47.6%)
  - community_knowledge: 11 issues (52.4%)

By Category:
  - mechanical: 2
  - thermal: 2
  - electrical: 3
  - hydraulic: 2
  - safety: 1
  - (uncategorized): 11

Issues with URLs: 5
Supported Languages: French, English
Machine Types: HyPET5e
```

## 🔄 Updating the Dataset

### Method 1: Add Issues Manually
```python
# Load, add, and save
db = MachineIssuesDatabase()
issues = db.get_all_issues()

new_issue = MachineIssue(
    problem="New issue description",
    cause="Root cause",
    solution="Solution steps",
    machine_type="HyPET5e",
    source="manual_addendum",
    category="electrical"
)

issues.append(new_issue)
db.issues = issues
db.export_to_json(Path('backend/data/machine_issues.json'))
```

### Method 2: Re-run Extraction Script
```bash
python scripts/create_machine_issues_dataset.py
```

### Method 3: Scrape Community Sources
```bash
python scripts/extract_machine_issues.py
```

## 🧪 Testing

### Test Loading the Service
```python
def test_load_issues():
    db = MachineIssuesDatabase()
    assert len(db.get_all_issues()) == 21
    assert len(db.get_by_source('manuals')) == 10
    assert len(db.get_by_source('community_knowledge')) == 11

def test_search():
    db = MachineIssuesDatabase()
    results = db.search_by_keyword('temperature')
    assert len(results) > 0

def test_get_embedding_texts():
    db = MachineIssuesDatabase()
    texts = db.get_embedding_texts()
    assert len(texts) == 21
    assert all(isinstance(t, str) for t in texts)
```

## 🛠️ Troubleshooting

### Issue: "File not found: machine_issues.json"
**Solution:** Ensure the file is located at `backend/data/machine_issues.json`

### Issue: "Encoding errors with French characters"
**Solution:** Ensure you're using UTF-8 encoding when reading the JSON:
```python
with open(file, 'r', encoding='utf-8') as f:
    ...
```

### Issue: "Empty results from search"
**Solution:** 
- Try broader search terms
- Use `field='all'` to search across all fields
- Check that the query matches the data language (French or English)

## 📚 Additional Resources

- Manual Location: `giba/MachineManual_FRE_0_1.pdf` (French)
- Manual Metadata: Husky HyPET5e/HPP5e v1.2 (May 2021)
- Manufacturer: [Husky Injection Molding Systems Limited](https://www.husky.ca/)

## 🔐 Data Privacy & Attribution

- All manual content is sourced from official Husky documentation
- Community sources are attributed with reference URLs
- Data is for internal maintenance training only
- Respect manufacturer IP rights when sharing

## 📝 License & Attribution

When using this dataset:

```
Machine Issues Dataset
Generated: May 11, 2026
Source: Husky HyPET5e/HPP5e Manual v1.2
Community sources: Various industry forums and knowledge bases
```

## 🎯 Next Steps

1. ✅ Dataset created and validated
2. ⬜ Ingest into vector database
3. ⬜ Create RAG search endpoints
4. ⬜ Integrate with chat service
5. ⬜ Train on domain-specific use cases
6. ⬜ Monitor and improve quality

---

**Last Updated:** May 11, 2026  
**Dataset Version:** 1.0  
**Status:** Ready for Production
