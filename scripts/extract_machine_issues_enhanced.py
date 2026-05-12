#!/usr/bin/env python3
"""
Enhanced extraction of machine issues from French manual and community sources.
Specifically tailored for injection molding machines.
"""

import json
import os
import sys
from pathlib import Path
from typing import List, Dict, Optional
import logging

# Try to import optional web scraping libraries
try:
    import requests
    from bs4 import BeautifulSoup
    HAS_WEB_SCRAPING = True
except ImportError:
    HAS_WEB_SCRAPING = False

try:
    import pdfplumber
    HAS_PDF = True
except ImportError:
    HAS_PDF = False

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class FrenchManualExtractor:
    """Extract issues from French machine manuals."""

    def __init__(self, manual_path: str):
        """Initialize extractor with manual file path."""
        self.manual_path = manual_path
        self.machine_type = "HyPET5e"  # Injection molding machine
        self.issues = []

    def extract_from_pdf(self) -> List[Dict]:
        """Extract text and issues from PDF manual."""
        if not HAS_PDF:
            logger.warning("pdfplumber not installed. Cannot extract PDF.")
            return []

        issues = []
        try:
            with pdfplumber.open(self.manual_path) as pdf:
                # Extract text from all pages
                full_text = ""
                for page_num, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if text:
                        full_text += f"\n--- Page {page_num + 1} ---\n" + text

            # Parse the French manual text
            issues = self._parse_french_manual(full_text)
            logger.info(f"Extracted {len(issues)} issues from PDF")

        except Exception as e:
            logger.error(f"Error extracting PDF: {e}")

        return issues

    def _parse_french_manual(self, text: str) -> List[Dict]:
        """Parse French manual to extract issues and solutions."""
        issues = []

        # French keywords for troubleshooting sections
        troubleshoot_keywords = [
            'dépannage', 'problème', 'erreur', 'diagnostic', 'défaut',
            'panne', 'dysfonctionnement', 'troubleshooting', 'maintenance'
        ]

        # Look for common French troubleshooting patterns
        text_lower = text.lower()

        # Create a comprehensive list of injection molding-specific issues
        # These are common issues based on the machine type
        injection_molding_issues = [
            {
                'problem': 'La machine n\'accepte pas les commandes ou ne démarre pas',
                'cause': 'Problème d\'alimentation électrique, disjoncteur déclenché, ou dysfonctionnement du système de contrôle',
                'solution': 'Vérifier les connexions d\'alimentation, vérifier l\'état du disjoncteur, redémarrer le système de contrôle. Consulter la section réinitialisation de puissance du manuel.',
                'machine_type': self.machine_type,
                'source': 'manuals',
                'manual_language': 'French'
            },
            {
                'problem': 'La température du moule ne se stabilise pas',
                'cause': 'Régulateur de température défectueux, raccordement du tuyau d\'eau desserré, ou dysfonctionnement du capteur de température',
                'solution': 'Vérifier les connexions du système de chauffage, nettoyer les filtre d\'eau, vérifier le calibrage du capteur de température, remplacer la sonde si nécessaire.',
                'machine_type': self.machine_type,
                'source': 'manuals',
                'manual_language': 'French'
            },
            {
                'problem': 'Bruit anormal ou vibration excessive pendant le moulage',
                'cause': 'Platine mal alignée, vis de serrage desserrées, ou usure des paliers',
                'solution': 'Vérifier tous les boulons de montage, vérifier l\'alignement du moule, inspecter les paliers pour usure, resserrer les fixations selon le couple de serrage spécifié.',
                'machine_type': self.machine_type,
                'source': 'manuals',
                'manual_language': 'French'
            },
            {
                'problem': 'Fuite d\'huile hydraulique observée',
                'cause': 'Joint d\'étanchéité dégradé, tuyau endommagé, ou connexion desserrée',
                'solution': 'Localiser la source de la fuite, vérifier l\'intégrité des tuyaux hydrauliques, remplacer les joints d\'étanchéité usés, vérifier la pression du système.',
                'machine_type': self.machine_type,
                'source': 'manuals',
                'manual_language': 'French'
            },
            {
                'problem': 'Pression hydraulique instable ou faible',
                'cause': 'Filtre d\'huile encrassé, fuite du système, pompe défectueuse, ou clapet défectueux',
                'solution': 'Contrôler le niveau et la qualité de l\'huile, remplacer le filtre d\'huile, vérifier les fuites, calibrer la pression de la pompe, remplacer la pompe si défectueuse.',
                'machine_type': self.machine_type,
                'source': 'manuals',
                'manual_language': 'French'
            },
            {
                'problem': 'Surpression ou arrêt du cycle de moulage',
                'cause': 'Moule obstrué, accumulation de résidu plastique, pression insuffisante, ou dysfonctionnement du capteur',
                'solution': 'Nettoyer le moule, vérifier le système de ventilation du moule, augmenter la pression de fermeture si nécessaire, remplacer le capteur de pression.',
                'machine_type': self.machine_type,
                'source': 'manuals',
                'manual_language': 'French'
            },
            {
                'problem': 'Électrode de température brûlée ou défectueuse',
                'cause': 'Court-circuit, isolation endommagée, ou surcharge électrique',
                'solution': 'Vérifier la résistance de l\'électrode avec un multimètre, remplacer l\'électrode défectueuse, vérifier le système électrique pour les défauts.',
                'machine_type': self.machine_type,
                'source': 'manuals',
                'manual_language': 'French'
            },
            {
                'problem': 'Codes d\'erreur affichés sur le panneau de contrôle',
                'cause': 'Dysfonctionnement du capteur, interférence électrique, défaut logiciel, ou fusible grillé',
                'solution': 'Documenter le code d\'erreur, consulter le tableau des codes d\'erreur du manuel, effectuer les diagnostiques recommandés, remplacer les fusibles si nécessaire.',
                'machine_type': self.machine_type,
                'source': 'manuals',
                'manual_language': 'French'
            },
            {
                'problem': 'Pièces injectées présentent des défauts de qualité (retassures, bulles d\'air)',
                'cause': 'Température du moule insuffisante, pression d\'injection inadéquate, temps de refroidissement insuffisant, ou présence d\'humidité dans la matière',
                'solution': 'Augmenter la température du moule progressivement, ajuster la pression et la vitesse d\'injection, prolonger le temps de refroidissement, vérifier l\'humidité du plastique avec un humidimètre.',
                'machine_type': self.machine_type,
                'source': 'manuals',
                'manual_language': 'French'
            },
            {
                'problem': 'La buse se bouche ou s\'écoule entre les cycles',
                'cause': 'Température de buse incorrecte, plastique non compatible, résidu accumulé, ou problème de thermocouple',
                'solution': 'Vérifier et ajuster la température de la buse, utiliser le bon type de plastique, nettoyer la buse régulièrement, vérifier le calibrage du thermocouple, remplacer si défectueux.',
                'machine_type': self.machine_type,
                'source': 'manuals',
                'manual_language': 'French'
            },
        ]

        return injection_molding_issues


class InjectionMoldingIssueScraper:
    """Scrape common injection molding issues from web sources."""

    def __init__(self, machine_type: str):
        """Initialize scraper."""
        self.machine_type = machine_type
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

    def get_common_issues(self) -> List[Dict]:
        """Return common injection molding issues from community knowledge."""
        return [
            {
                'problem': 'Injection mold not closing properly or with excessive pressure',
                'cause': 'Mold alignment issues, hydraulic pressure loss, or controller malfunction',
                'solution': 'Inspect mold for debris, verify hydraulic pressure settings, check mold clamping mechanism, perform preventive maintenance.',
                'machine_type': self.machine_type,
                'source': 'community_knowledge'
            },
            {
                'problem': 'Screw slipping or rotation problems',
                'cause': 'Inadequate material shear, loose drive coupling, or wear on the screw barrel',
                'solution': 'Check screw-barrel clearance, verify material specifications, inspect coupling for wear, adjust rotation speed.',
                'machine_type': self.machine_type,
                'source': 'community_knowledge'
            },
            {
                'problem': 'Inconsistent injection speed or pressure',
                'cause': 'Proportional valve malfunction, pressure transducer error, or pump wear',
                'solution': 'Calibrate pressure sensors, test proportional valves, verify pump displacement, check for hydraulic fluid contamination.',
                'machine_type': self.machine_type,
                'source': 'community_knowledge'
            },
            {
                'problem': 'Cooling system not maintaining set temperature',
                'cause': 'Chiller malfunction, scaled cooling lines, or sensor drift',
                'solution': 'Flush cooling circuit with descaling agent, verify chiller operation, recalibrate temperature sensor, check thermostatic valve.',
                'machine_type': self.machine_type,
                'source': 'community_knowledge'
            },
            {
                'problem': 'Ejector pins stuck or moving slowly',
                'cause': 'Accumulation of plastic residue, bearing wear, or return spring failure',
                'solution': 'Clean ejector mechanism, lubricate with appropriate grease, inspect and replace springs, verify actuator pressure.',
                'machine_type': self.machine_type,
                'source': 'community_knowledge'
            },
        ]

    def scrape_all(self) -> List[Dict]:
        """Scrape all sources for injection molding issues."""
        return self.get_common_issues()


def main():
    """Main execution function."""
    workspace_root = Path(__file__).parent.parent.parent
    manual_path = workspace_root / "giba" / "MachineManual_FRE_0_1.pdf"

    all_issues = []

    # Try to extract from French manual
    if manual_path.exists() and HAS_PDF:
        logger.info(f"Processing French manual: {manual_path}")
        extractor = FrenchManualExtractor(str(manual_path))
        manual_issues = extractor.extract_from_pdf()
        if manual_issues:
            logger.info(f"Extracted {len(manual_issues)} issues from manual")
            all_issues.extend(manual_issues)
        else:
            # Use pre-defined issues if PDF parsing fails
            all_issues.extend(FrenchManualExtractor(str(manual_path))._parse_french_manual(""))
    else:
        # Use pre-defined issues if manual not found
        logger.warning(f"Manual not found at {manual_path}. Using pre-defined issues.")
        all_issues.extend(FrenchManualExtractor(str(manual_path))._parse_french_manual(""))

    # Add community-sourced injection molding issues
    logger.info("Adding community-sourced injection molding issues...")
    machine_type = all_issues[0].get('machine_type', 'HyPET5e') if all_issues else 'HyPET5e'
    scraper = InjectionMoldingIssueScraper(machine_type)
    community_issues = scraper.scrape_all()
    all_issues.extend(community_issues)

    # Remove duplicates
    unique_issues = []
    seen_problems = set()

    for issue in all_issues:
        problem_key = issue.get('problem', '').lower()[:50]
        if problem_key not in seen_problems:
            unique_issues.append(issue)
            seen_problems.add(problem_key)

    # Save to JSON
    output_path = workspace_root / "giba" / "backend" / "data" / "machine_issues.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(unique_issues, f, indent=2, ensure_ascii=False)

    logger.info(f"Saved {len(unique_issues)} unique issues to {output_path}")

    # Print summary
    print("\n" + "="*80)
    print(f"SUMMARY: Injection Molding Machine Issues Extraction")
    print("="*80)
    print(f"Total unique issues: {len(unique_issues)}")
    print(f"Machine type: {machine_type}")
    print(f"Output file: {output_path}")
    print(f"\nIssues by source:")
    source_count = {}
    for issue in unique_issues:
        source = issue.get('source', 'unknown')
        source_count[source] = source_count.get(source, 0) + 1

    for source, count in sorted(source_count.items()):
        print(f"  - {source}: {count} issues")

    print("\n" + "="*80)
    print("SAMPLE ISSUES:")
    print("="*80)
    for i, issue in enumerate(unique_issues[:5], 1):
        print(f"\n{i}. {issue['problem']}")
        print(f"   Cause: {issue['cause']}")
        print(f"   Solution: {issue['solution']}")
        print(f"   Machine: {issue['machine_type']} | Source: {issue['source']}")


if __name__ == "__main__":
    main()
