#!/usr/bin/env python3
"""
Verify that machine issues were populated in the database.
"""

import sys
from pathlib import Path

# Add backend app to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.session import SessionLocal
from app.models.report import Report
from app.models.vector_document import VectorDocument

def verify_population():
    """Verify that machine issues were populated."""
    db = SessionLocal()
    
    try:
        # Count reports
        report_count = db.query(Report).count()
        
        # Count vector documents
        vector_count = db.query(VectorDocument).count()
        
        print("\n" + "="*80)
        print("DATABASE VERIFICATION RESULTS")
        print("="*80)
        print(f"Total reports in database: {report_count}")
        print(f"Total vector documents in database: {vector_count}")
        
        # Show sample report
        sample_report = db.query(Report).first()
        if sample_report:
            print(f"\nSample Report:")
            print(f"  ID: {sample_report.id}")
            print(f"  Machine Type: {sample_report.machine_type}")
            print(f"  Source: {sample_report.source}")
            print(f"  Problem: {sample_report.clean_problem[:100]}...")
            print(f"  Metadata: {sample_report.metadata_}")
        
        # Show sample vector
        sample_vector = db.query(VectorDocument).first()
        if sample_vector:
            print(f"\nSample Vector Document:")
            print(f"  ID: {sample_vector.id}")
            print(f"  Machine Type: {sample_vector.machine_type}")
            print(f"  Source: {sample_vector.source}")
            print(f"  Document: {sample_vector.document[:100]}...")
            print(f"  Embedding dimensions: {len(sample_vector.embedding)}")
            print(f"  Metadata: {sample_vector.metadata_}")
        
        # Query by machine type
        hypet_reports = db.query(Report).filter(Report.machine_type == "HyPET5e").count()
        hypet_vectors = db.query(VectorDocument).filter(VectorDocument.machine_type == "HyPET5e").count()
        
        print(f"\nHyPET5e Machine Issues:")
        print(f"  Reports: {hypet_reports}")
        print(f"  Vectors: {hypet_vectors}")
        
        # Query by source
        manual_reports = db.query(Report).filter(Report.source == "manuals").count()
        community_reports = db.query(Report).filter(Report.source == "community_knowledge").count()
        
        print(f"\nIssues by Source:")
        print(f"  Manuals: {manual_reports}")
        print(f"  Community Knowledge: {community_reports}")
        
        print("="*80 + "\n")
        
        if report_count > 0 and vector_count > 0:
            print("✓ Database successfully populated with machine issues!")
            return 0
        else:
            print("✗ Database appears to be empty")
            return 1
            
    except Exception as e:
        print(f"Error verifying population: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(verify_population())
