#!/usr/bin/env python3
"""
Populate the database with machine issues - simplified version.
This script uses direct database connection without app dependencies.
"""

import json
import uuid
from datetime import datetime
from pathlib import Path
import sys

# PostgreSQL connection
import psycopg2
from psycopg2.extras import Json

# Ensure backend root on sys.path so `import app` works when run from anywhere.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.services.embedding_service import EmbeddingService

import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class SimpleDataPopulator:
    """Populate database with machine issues using direct PostgreSQL connection."""

    def __init__(self, host="localhost", port=5432, database="giba_maintainance_assistant", 
                 user="giba_user", password=""):
        """Initialize database connection."""
        try:
            self.conn = psycopg2.connect(
                host=host,
                port=port,
                database=database,
                user=user,
                password=password
            )
            self.cursor = self.conn.cursor()
            logger.info(f"Connected to PostgreSQL database: {database}")
        except psycopg2.Error as e:
            logger.error(f"Failed to connect to database: {e}")
            raise

        # Initialize the Voyage AI embedding client
        logger.info("Initializing Voyage AI embedding client...")
        self.embeddings = EmbeddingService()
        logger.info("Embedding client ready")

    def ensure_admin_user(self):
        """Ensure admin user exists."""
        admin_id = "system-admin-machine-issues"
        username = "system_machine_issues"
        
        try:
            # Check if user exists
            self.cursor.execute("SELECT id FROM users WHERE id = %s", (admin_id,))
            existing = self.cursor.fetchone()
            
            if existing:
                logger.info(f"Admin user already exists: {admin_id}")
                return admin_id
            
            # Create admin user
            logger.info("Creating system admin user...")
            created_at = datetime.utcnow().isoformat()
            updated_at = datetime.utcnow().isoformat()
            
            self.cursor.execute("""
                INSERT INTO users (id, username, password_hash, role, allowed_machines, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                admin_id,
                username,
                "",  # No password
                "admin",
                Json(["*"]),  # All machines
                created_at,
                updated_at
            ))
            self.conn.commit()
            logger.info(f"Created admin user: {admin_id}")
            return admin_id
            
        except psycopg2.Error as e:
            logger.error(f"Error creating admin user: {e}")
            self.conn.rollback()
            raise

    def load_issues(self, json_path):
        """Load issues from JSON file."""
        logger.info(f"Loading issues from {json_path}")
        
        if not json_path.exists():
            raise FileNotFoundError(f"JSON file not found: {json_path}")
        
        with open(json_path, 'r', encoding='utf-8') as f:
            issues = json.load(f)
        
        logger.info(f"Loaded {len(issues)} issues")
        return issues

    def populate(self, issues, admin_user_id):
        """Populate database with issues."""
        logger.info(f"Starting population of {len(issues)} issues...")
        
        # Generate embeddings
        logger.info("Generating embeddings via Voyage AI...")
        texts = [f"{i['problem']}. {i['cause']}. {i['solution']}" for i in issues]
        embeddings = self.embeddings.embed_texts(texts, input_type="document")
        
        reports_created = 0
        vectors_created = 0
        
        for idx, (issue, embedding) in enumerate(zip(issues, embeddings)):
            try:
                report_id = str(uuid.uuid4())
                created_at = datetime.utcnow().isoformat()
                updated_at = datetime.utcnow().isoformat()
                
                # Insert into reports table
                combined_text = f"{issue['problem']}. {issue['cause']}. {issue['solution']}"
                
                metadata = {
                    'original_source': issue.get('source'),
                    'manufacturer': issue.get('manufacturer'),
                    'manual_language': issue.get('manual_language'),
                    'url': issue.get('url'),
                    'category': issue.get('category'),
                    'imported_from': 'machine_issues_dataset',
                    'import_timestamp': datetime.utcnow().isoformat(),
                }
                
                self.cursor.execute("""
                    INSERT INTO reports 
                    (id, user_id, machine_type, problem, cause, solution, 
                     clean_problem, clean_cause, clean_solution, combined_clean_text, 
                     source, metadata, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    report_id,
                    admin_user_id,
                    issue.get('machine_type', 'HyPET5e'),
                    issue.get('problem', ''),
                    issue.get('cause', ''),
                    issue.get('solution', ''),
                    issue.get('problem', ''),
                    issue.get('cause', ''),
                    issue.get('solution', ''),
                    combined_text,
                    issue.get('source', 'manuals'),
                    Json(metadata),
                    created_at,
                    updated_at
                ))
                
                reports_created += 1
                
                # Insert into vector_documents table
                vector_id = f"machine_issue:{report_id}"
                vector_metadata = {
                    'report_id': report_id,
                    'problem': issue.get('problem'),
                    'source_type': issue.get('source'),
                    'manufacturer': issue.get('manufacturer'),
                    'category': issue.get('category'),
                    'url': issue.get('url'),
                }
                
                # Convert embedding to list of floats
                embedding_list = [float(x) for x in embedding]
                
                self.cursor.execute("""
                    INSERT INTO vector_documents 
                    (id, machine_type, source, document, embedding, metadata, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    vector_id,
                    issue.get('machine_type', 'HyPET5e'),
                    issue.get('source', 'manuals'),
                    combined_text,
                    embedding_list,
                    Json(vector_metadata),
                    created_at,
                    updated_at
                ))
                
                vectors_created += 1
                
                if (idx + 1) % 5 == 0:
                    self.conn.commit()
                    logger.info(f"Processed {idx + 1}/{len(issues)} issues...")
                
            except psycopg2.Error as e:
                logger.error(f"Error processing issue {idx}: {e}")
                self.conn.rollback()
                continue
        
        # Final commit
        self.conn.commit()
        
        logger.info(f"Population complete!")
        logger.info(f"Reports created: {reports_created}")
        logger.info(f"Vector documents created: {vectors_created}")
        
        return reports_created, vectors_created

    def verify(self):
        """Verify population."""
        logger.info("Verifying population...")
        
        self.cursor.execute("SELECT COUNT(*) FROM reports")
        report_count = self.cursor.fetchone()[0]
        
        self.cursor.execute("SELECT COUNT(*) FROM vector_documents")
        vector_count = self.cursor.fetchone()[0]
        
        logger.info(f"Total reports in database: {report_count}")
        logger.info(f"Total vector documents in database: {vector_count}")
        
        # Show sample
        self.cursor.execute("SELECT id, machine_type, clean_problem, source FROM reports LIMIT 1")
        sample = self.cursor.fetchone()
        if sample:
            logger.info(f"\nSample Report:")
            logger.info(f"  ID: {sample[0]}")
            logger.info(f"  Machine: {sample[1]}")
            logger.info(f"  Problem: {sample[2][:80]}...")
            logger.info(f"  Source: {sample[3]}")

    def close(self):
        """Close database connection."""
        self.cursor.close()
        self.conn.close()
        logger.info("Database connection closed")


def main():
    """Main execution."""
    workspace_root = Path(__file__).parent.parent.parent
    json_path = workspace_root / "backend" / "data" / "machine_issues.json"
    
    populator = SimpleDataPopulator()
    
    try:
        # Ensure admin user exists
        admin_id = populator.ensure_admin_user()
        
        # Load issues
        issues = populator.load_issues(json_path)
        
        # Populate database
        reports_count, vectors_count = populator.populate(issues, admin_id)
        
        # Verify
        populator.verify()
        
        # Print summary
        print("\n" + "="*80)
        print("DATABASE POPULATION COMPLETE")
        print("="*80)
        print(f"Reports created: {reports_count}")
        print(f"Vector documents created: {vectors_count}")
        print(f"Total issues processed: {len(issues)}")
        print("="*80 + "\n")
        
        return 0
        
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        return 1
    
    finally:
        populator.close()


if __name__ == "__main__":
    sys.exit(main())
