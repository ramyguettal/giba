"""Populate machine issues data.

Revision ID: populate_machine_issues
Revises: 0002_vector_documents
Create Date: 2026-05-11 19:30:00.000000

"""
from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = 'populate_machine_issues'
down_revision = '0002_vector_documents'
branch_labels = None
depends_on = None


def load_machine_issues() -> list[dict]:
    """Load machine issues from JSON."""
    backend_dir = Path(__file__).resolve().parents[2]
    json_path = backend_dir / "data" / "machine_issues.json"

    if not json_path.exists():
        raise FileNotFoundError(
            "Machine issues JSON not found. "
            f"Expected at: {json_path}"
        )

    with open(json_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    if not isinstance(payload, list):
        raise TypeError(f"Expected a JSON array of issues, got: {type(payload).__name__}")
    if not payload:
        raise ValueError(f"Dataset is empty: {json_path}")

    return payload


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate document embeddings for texts via the Voyage AI API.

    Falls back to zero vectors (of the correct dimension) when no
    ``VOYAGE_API_KEY`` is configured, so the migration still applies offline.
    """
    from app.core.config import settings

    dim = settings.VECTOR_EMBEDDING_DIM

    if not settings.VOYAGE_API_KEY:
        print(f"Warning: VOYAGE_API_KEY not set, using zero embeddings ({dim} dims)")
        return [[0.0] * dim for _ in texts]

    from app.services.embedding_service import EmbeddingService

    return EmbeddingService().embed_texts(texts, input_type="document")


def upgrade() -> None:
    """Upgrade: Populate machine issues data."""
    
    # Load issues
    issues = load_machine_issues()
    
    print(f"Populating {len(issues)} machine issues...")
    
    # Ensure admin user exists
    admin_id = "system-admin-machine-issues"
    conn = op.get_bind()
    
    # Check if admin user exists
    result = conn.execute(text("SELECT id FROM users WHERE id = :id"), {"id": admin_id})
    existing_admin = result.fetchone()
    
    if not existing_admin:
        print("Creating system admin user...")
        conn.execute(text("""
            INSERT INTO users (id, username, password_hash, role, allowed_machines, created_at, updated_at)
            VALUES (:id, :username, :password_hash, :role, :allowed_machines, :created_at, :updated_at)
        """), {
            "id": admin_id,
            "username": "system_machine_issues",
            "password_hash": "",
            "role": "admin",
            "allowed_machines": json.dumps(["*"]),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        })
    else:
        print(f"Admin user already exists")
    
    # Generate embeddings
    print("Generating embeddings...")
    texts = [f"{i['problem']}. {i['cause']}. {i['solution']}" for i in issues]
    embeddings = generate_embeddings(texts)
    
    # Insert reports and vector documents
    print("Inserting data...")
    for idx, (issue, embedding) in enumerate(zip(issues, embeddings)):
        report_id = str(uuid.uuid4())
        vector_id = f"machine_issue:{report_id}"
        now = datetime.utcnow().isoformat()
        combined_text = f"{issue['problem']}. {issue['cause']}. {issue['solution']}"
        
        metadata = {
            'original_source': issue.get('source'),
            'manufacturer': issue.get('manufacturer'),
            'manual_language': issue.get('manual_language'),
            'url': issue.get('url'),
            'category': issue.get('category'),
            'imported_from': 'machine_issues_dataset',
            'import_timestamp': now,
        }
        
        vector_metadata = {
            'report_id': report_id,
            'problem': issue.get('problem'),
            'source_type': issue.get('source'),
            'manufacturer': issue.get('manufacturer'),
            'category': issue.get('category'),
            'url': issue.get('url'),
        }
        
        # Insert report
        conn.execute(text("""
            INSERT INTO reports 
            (id, user_id, machine_type, problem, cause, solution, 
             clean_problem, clean_cause, clean_solution, combined_clean_text, 
             source, metadata, created_at, updated_at)
            VALUES 
            (:id, :user_id, :machine_type, :problem, :cause, :solution,
             :clean_problem, :clean_cause, :clean_solution, :combined_clean_text,
             :source, :metadata, :created_at, :updated_at)
        """), {
            "id": report_id,
            "user_id": admin_id,
            "machine_type": issue.get('machine_type', 'HyPET5e'),
            "problem": issue.get('problem', ''),
            "cause": issue.get('cause', ''),
            "solution": issue.get('solution', ''),
            "clean_problem": issue.get('problem', ''),
            "clean_cause": issue.get('cause', ''),
            "clean_solution": issue.get('solution', ''),
            "combined_clean_text": combined_text,
            "source": issue.get('source', 'manuals'),
            "metadata": json.dumps(metadata),
            "created_at": now,
            "updated_at": now,
        })
        
        # Insert vector document
        # For pgvector, we need to cast the array as vector type
        conn.execute(text("""
            INSERT INTO vector_documents 
            (id, machine_type, source, document, embedding, metadata, created_at, updated_at)
            VALUES 
            (:id, :machine_type, :source, :document, CAST(:embedding AS vector), :metadata, :created_at, :updated_at)
        """), {
            "id": vector_id,
            "machine_type": issue.get('machine_type', 'HyPET5e'),
            "source": issue.get('source', 'manuals'),
            "document": combined_text,
            "embedding": "[" + ",".join(str(x) for x in embedding) + "]",
            "metadata": json.dumps(vector_metadata),
            "created_at": now,
            "updated_at": now,
        })
        
        if (idx + 1) % 5 == 0:
            print(f"  Processed {idx + 1}/{len(issues)} issues...")
    
    print(f"Successfully populated {len(issues)} machine issues!")


def downgrade() -> None:
    """Downgrade: Remove populated machine issues data."""
    conn = op.get_bind()
    admin_id = "system-admin-machine-issues"
    
    print("Removing machine issues data...")
    
    # Get all report IDs created by the admin user
    result = conn.execute(text("SELECT id FROM reports WHERE user_id = :user_id"), {"user_id": admin_id})
    report_ids = [row[0] for row in result.fetchall()]
    
    # Delete vector documents
    for report_id in report_ids:
        conn.execute(text("DELETE FROM vector_documents WHERE id = :id"), 
                    {"id": f"machine_issue:{report_id}"})
    
    # Delete reports
    conn.execute(text("DELETE FROM reports WHERE user_id = :user_id"), {"user_id": admin_id})
    
    # Delete admin user
    conn.execute(text("DELETE FROM users WHERE id = :id"), {"id": admin_id})
    print(f"Removed {len(report_ids)} machine issues")
