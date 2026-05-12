#!/usr/bin/env python3
"""
Verify database population using direct SQL queries.
"""

import sys
from pathlib import Path

def verify_population():
    """Verify machine issues in database."""
    try:
        import psycopg2
    except ImportError:
        print("psycopg2 not available, trying with sqlalchemy...")
        try:
            import sqlalchemy
        except ImportError:
            print("Error: Need psycopg2 or sqlalchemy installed")
            return 1
    
    try:
        # Try direct PostgreSQL connection
        try:
            import psycopg2
            conn = psycopg2.connect(
                host="localhost",
                port=5432,
                database="giba_maintainance_assistant",
                user="giba_user",
                password=""
            )
            cursor = conn.cursor()
        except:
            # Try using SQLAlchemy
            from sqlalchemy import create_engine, text
            engine = create_engine("postgresql://giba_user:@localhost:5432/giba_maintainance_assistant")
            conn = engine.connect()
            
            # Count records
            result_reports = conn.execute(text("SELECT COUNT(*) FROM reports"))
            report_count = result_reports.scalar()
            
            result_vectors = conn.execute(text("SELECT COUNT(*) FROM vector_documents"))
            vector_count = result_vectors.scalar()
            
            print("\n" + "="*80)
            print("DATABASE VERIFICATION RESULTS")
            print("="*80)
            print(f"Total reports in database: {report_count}")
            print(f"Total vector documents in database: {vector_count}")
            
            # Sample report
            result = conn.execute(text("SELECT id, machine_type, source, clean_problem FROM reports LIMIT 1"))
            sample = result.fetchone()
            if sample:
                print(f"\nSample Report:")
                print(f"  ID: {sample[0]}")
                print(f"  Machine Type: {sample[1]}")
                print(f"  Source: {sample[2]}")
                print(f"  Problem: {sample[3][:100]}...")
            
            # Count by source
            result_manual = conn.execute(text("SELECT COUNT(*) FROM reports WHERE source = 'manuals'"))
            manual_count = result_manual.scalar()
            
            result_community = conn.execute(text("SELECT COUNT(*) FROM reports WHERE source = 'community_knowledge'"))
            community_count = result_community.scalar()
            
            print(f"\nIssues by Source:")
            print(f"  Manuals: {manual_count}")
            print(f"  Community Knowledge: {community_count}")
            
            print("="*80 + "\n")
            
            if report_count > 0 and vector_count > 0:
                print("✓ Database successfully populated with machine issues!")
                return 0
            else:
                print("✗ Database appears to be empty")
                return 1
            
    except Exception as e:
        print(f"Error verifying population: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(verify_population())
