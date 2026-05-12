#!/usr/bin/env python3
"""
Populate the database with machine issues from the JSON dataset.
Populates both the reports table and vector_documents table.
"""

import json
import sys
import uuid
from datetime import datetime
from pathlib import Path

from sqlalchemy.orm import Session

# Add backend app to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.session import SessionLocal, engine
from app.models.base import Base
from app.models.report import Report
from app.models.vector_document import VectorDocument
from app.models.user import User
from app.services.embedding_service import EmbeddingService
from app.repositories.report_repository import ReportRepository

import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class DatabasePopulator:
    """Populate database with machine issues."""

    def __init__(self):
        """Initialize the populator."""
        self.db = SessionLocal()
        self.embedding_service = EmbeddingService()
        self.report_repo = ReportRepository(self.db)
        self.admin_user = None

    def ensure_tables_exist(self):
        """Ensure all necessary tables are created."""
        logger.info("Creating database tables if they don't exist...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables ready")

    def get_or_create_admin_user(self) -> User:
        """Get or create a system admin user for machine issues."""
        admin_id = "system-admin-machine-issues"
        
        # Try to get existing admin user
        existing = self.db.query(User).filter(User.id == admin_id).first()
        if existing:
            logger.info(f"Using existing admin user: {admin_id}")
            return existing
        
        # Create new admin user
        logger.info("Creating system admin user for machine issues...")
        admin_user = User(
            id=admin_id,
            username="system_machine_issues",
            password_hash="",  # No password needed for system user
            role="admin",
            allowed_machines=["*"],  # All machines
        )
        self.db.add(admin_user)
        self.db.commit()
        self.db.refresh(admin_user)
        logger.info(f"Created admin user: {admin_id}")
        return admin_user

    def load_issues_from_json(self, json_path: Path) -> list[dict]:
        """Load machine issues from JSON file."""
        logger.info(f"Loading issues from {json_path}")
        
        if not json_path.exists():
            raise FileNotFoundError(f"JSON file not found: {json_path}")
        
        with open(json_path, 'r', encoding='utf-8') as f:
            issues = json.load(f)
        
        logger.info(f"Loaded {len(issues)} issues")
        return issues

    def populate_database(self, issues: list[dict]):
        """Populate reports and vector documents tables."""
        logger.info(f"Starting population of {len(issues)} issues...")
        
        # Get admin user
        admin_user = self.get_or_create_admin_user()
        
        # Prepare texts for batch embedding
        texts_for_embedding = []
        issue_data = []
        
        for issue in issues:
            # Combine text for embedding
            combined_text = f"{issue['problem']}. {issue['cause']}. {issue['solution']}"
            texts_for_embedding.append(combined_text)
            issue_data.append({
                'issue': issue,
                'combined_text': combined_text
            })
        
        logger.info(f"Generating embeddings for {len(texts_for_embedding)} issues...")
        embeddings = self.embedding_service.embed_texts(texts_for_embedding)
        
        # Create reports and vector documents
        reports_created = 0
        vectors_created = 0
        
        for idx, (item, embedding) in enumerate(zip(issue_data, embeddings)):
            issue = item['issue']
            combined_text = item['combined_text']
            
            try:
                # Create Report entry
                report = Report(
                    id=str(uuid.uuid4()),
                    user_id=admin_user.id,
                    machine_type=issue.get('machine_type', 'HyPET5e'),
                    problem=issue.get('problem', ''),
                    cause=issue.get('cause', ''),
                    solution=issue.get('solution', ''),
                    clean_problem=issue.get('problem', ''),
                    clean_cause=issue.get('cause', ''),
                    clean_solution=issue.get('solution', ''),
                    combined_clean_text=combined_text,
                    source=issue.get('source', 'manuals'),
                    metadata_={
                        'original_source': issue.get('source'),
                        'manufacturer': issue.get('manufacturer'),
                        'manual_language': issue.get('manual_language'),
                        'url': issue.get('url'),
                        'category': issue.get('category'),
                        'imported_from': 'machine_issues_dataset',
                        'import_timestamp': datetime.utcnow().isoformat(),
                    }
                )
                
                # Save report
                report = self.report_repo.create(report)
                reports_created += 1
                logger.info(f"Created report {reports_created}/{len(issues)}: {report.id[:8]}...")
                
                # Create VectorDocument entry
                vector_doc = VectorDocument(
                    id=f"machine_issue:{report.id}",
                    machine_type=report.machine_type,
                    source=report.source,
                    document=combined_text,
                    embedding=embedding,
                    metadata_={
                        'report_id': report.id,
                        'problem': issue.get('problem'),
                        'source_type': issue.get('source'),
                        'manufacturer': issue.get('manufacturer'),
                        'category': issue.get('category'),
                        'url': issue.get('url'),
                    }
                )
                
                # Save vector document
                self.db.add(vector_doc)
                self.db.commit()
                vectors_created += 1
                logger.info(f"Created vector document {vectors_created}/{len(issues)}: {vector_doc.id[:20]}...")
                
            except Exception as e:
                logger.error(f"Error processing issue {idx}: {e}")
                self.db.rollback()
                continue
        
        logger.info(f"Population complete!")
        logger.info(f"Reports created: {reports_created}")
        logger.info(f"Vector documents created: {vectors_created}")
        
        return reports_created, vectors_created

    def verify_population(self):
        """Verify that data was populated correctly."""
        logger.info("Verifying population...")
        
        report_count = self.db.query(Report).count()
        vector_count = self.db.query(VectorDocument).count()
        
        logger.info(f"Total reports in database: {report_count}")
        logger.info(f"Total vector documents in database: {vector_count}")
        
        # Show sample
        sample_report = self.db.query(Report).first()
        if sample_report:
            logger.info(f"\nSample Report:")
            logger.info(f"  ID: {sample_report.id}")
            logger.info(f"  Machine: {sample_report.machine_type}")
            logger.info(f"  Problem: {sample_report.clean_problem[:80]}...")
            logger.info(f"  Source: {sample_report.source}")
        
        sample_vector = self.db.query(VectorDocument).first()
        if sample_vector:
            logger.info(f"\nSample Vector Document:")
            logger.info(f"  ID: {sample_vector.id}")
            logger.info(f"  Machine: {sample_vector.machine_type}")
            logger.info(f"  Document: {sample_vector.document[:80]}...")
            logger.info(f"  Embedding dims: {len(sample_vector.embedding)}")

    def close(self):
        """Close database session."""
        self.db.close()


def main():
    """Main execution function."""
    workspace_root = Path(__file__).parent.parent.parent
    json_path = workspace_root / "backend" / "data" / "machine_issues.json"
    
    populator = DatabasePopulator()
    
    try:
        # Ensure tables exist
        populator.ensure_tables_exist()
        
        # Load issues
        issues = populator.load_issues_from_json(json_path)
        
        # Populate database
        reports_count, vectors_count = populator.populate_database(issues)
        
        # Verify
        populator.verify_population()
        
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
