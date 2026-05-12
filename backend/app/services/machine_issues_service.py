#!/usr/bin/env python3
"""
Utility functions to load and manage the machine issues dataset.
Can be integrated into your backend services for RAG and chatbot functionality.
"""

import json
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class MachineIssue:
    """Data class representing a machine issue."""
    problem: str
    cause: str
    solution: str
    machine_type: str
    source: str
    manufacturer: Optional[str] = None
    manual_language: Optional[str] = None
    url: Optional[str] = None
    category: Optional[str] = None

    def to_dict(self) -> Dict:
        """Convert to dictionary, excluding None values."""
        return {k: v for k, v in self.__dict__.items() if v is not None}

    def to_embedding_text(self) -> str:
        """Generate combined text suitable for embedding."""
        return f"{self.problem}. Cause: {self.cause}. Solution: {self.solution}"


class MachineIssuesDatabase:
    """Database handler for machine issues."""

    def __init__(self, data_file: Optional[Path] = None):
        """
        Initialize the database.
        
        Args:
            data_file: Path to the machine_issues.json file.
                      If None, uses the default location.
        """
        if data_file is None:
            # Infer default location
            current_dir = Path(__file__).parent
            data_file = current_dir / "machine_issues.json"
        
        self.data_file = data_file
        self.issues: List[MachineIssue] = []
        self.load_issues()

    def load_issues(self) -> None:
        """Load issues from JSON file."""
        if not self.data_file.exists():
            raise FileNotFoundError(f"Machine issues file not found: {self.data_file}")

        with open(self.data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        self.issues = [
            MachineIssue(
                problem=item['problem'],
                cause=item['cause'],
                solution=item['solution'],
                machine_type=item['machine_type'],
                source=item['source'],
                manufacturer=item.get('manufacturer'),
                manual_language=item.get('manual_language'),
                url=item.get('url'),
                category=item.get('category')
            )
            for item in data
        ]

    def get_all_issues(self) -> List[MachineIssue]:
        """Get all issues."""
        return self.issues

    def get_by_machine_type(self, machine_type: str) -> List[MachineIssue]:
        """Filter issues by machine type."""
        return [i for i in self.issues if i.machine_type == machine_type]

    def get_by_source(self, source: str) -> List[MachineIssue]:
        """Filter issues by source."""
        return [i for i in self.issues if i.source == source]

    def get_by_category(self, category: str) -> List[MachineIssue]:
        """Filter issues by category."""
        return [i for i in self.issues if i.category == category]

    def search_by_keyword(self, keyword: str, field: str = 'problem') -> List[MachineIssue]:
        """
        Search issues by keyword in specified field.
        
        Args:
            keyword: Search term (case-insensitive)
            field: Field to search in ('problem', 'cause', 'solution', 'all')
        
        Returns:
            List of matching issues
        """
        keyword_lower = keyword.lower()
        results = []

        for issue in self.issues:
            if field == 'all':
                text = (
                    issue.problem.lower() + ' ' +
                    issue.cause.lower() + ' ' +
                    issue.solution.lower()
                )
            elif field == 'problem':
                text = issue.problem.lower()
            elif field == 'cause':
                text = issue.cause.lower()
            elif field == 'solution':
                text = issue.solution.lower()
            else:
                continue

            if keyword_lower in text:
                results.append(issue)

        return results

    def get_embedding_texts(self) -> List[str]:
        """
        Get all issues as combined text suitable for embedding.
        
        Returns:
            List of combined text strings for each issue
        """
        return [issue.to_embedding_text() for issue in self.issues]

    def get_issues_with_metadata(self) -> List[Dict]:
        """
        Get all issues with their metadata as dictionaries.
        Useful for storing in vector database with metadata.
        
        Returns:
            List of issue dictionaries
        """
        return [issue.to_dict() for issue in self.issues]

    def get_statistics(self) -> Dict:
        """Get statistics about the dataset."""
        source_counts = {}
        category_counts = {}
        machine_types = set()
        languages = set()

        for issue in self.issues:
            source = issue.source
            source_counts[source] = source_counts.get(source, 0) + 1

            if issue.category:
                category_counts[issue.category] = category_counts.get(issue.category, 0) + 1

            machine_types.add(issue.machine_type)

            if issue.manual_language:
                languages.add(issue.manual_language)

        return {
            'total_issues': len(self.issues),
            'source_distribution': source_counts,
            'category_distribution': category_counts,
            'unique_machine_types': list(machine_types),
            'languages': list(languages),
            'issues_with_urls': sum(1 for i in self.issues if i.url),
            'issues_with_categories': sum(1 for i in self.issues if i.category),
        }

    def export_to_json(self, output_path: Path) -> None:
        """Export current issues to JSON file."""
        data = [issue.to_dict() for issue in self.issues]
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def print_summary(self) -> None:
        """Print a summary of the database."""
        stats = self.get_statistics()
        print("\n" + "="*70)
        print("MACHINE ISSUES DATABASE SUMMARY")
        print("="*70)
        print(f"Total Issues: {stats['total_issues']}")
        print(f"Machine Types: {', '.join(stats['unique_machine_types'])}")
        print(f"Languages: {', '.join(stats['languages'])}")
        print("\nIssues by Source:")
        for source, count in sorted(stats['source_distribution'].items()):
            print(f"  - {source}: {count}")
        
        if stats['category_distribution']:
            print("\nIssues by Category:")
            for category, count in sorted(stats['category_distribution'].items()):
                print(f"  - {category}: {count}")
        
        print(f"\nIssues with Reference URLs: {stats['issues_with_urls']}")
        print("="*70 + "\n")


def example_usage():
    """Example usage of the MachineIssuesDatabase."""
    # Initialize database
    db = MachineIssuesDatabase()

    # Print summary
    db.print_summary()

    # Get statistics
    stats = db.get_statistics()
    print(f"Statistics: {stats}\n")

    # Search by keyword
    print("Searching for issues related to 'temperature':")
    temp_issues = db.search_by_keyword('temperature', field='all')
    for issue in temp_issues:
        print(f"  - {issue.problem}")

    # Filter by source
    print("\nManual-based issues:")
    manual_issues = db.get_by_source('manuals')
    for issue in manual_issues[:3]:
        print(f"  - {issue.problem}")

    # Get embedding texts for RAG
    embedding_texts = db.get_embedding_texts()
    print(f"\nGenerated {len(embedding_texts)} texts for embedding")
    print(f"First embedding text sample:\n  {embedding_texts[0][:100]}...\n")


if __name__ == "__main__":
    example_usage()
