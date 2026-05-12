#!/usr/bin/env python3
"""
Create comprehensive machine issues dataset from manual metadata and community sources.
For Husky HyPET5e/HPP5e Injection Molding Machines.
"""

import json
from pathlib import Path
from typing import List, Dict
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def get_injection_molding_issues() -> List[Dict]:
    """Get comprehensive injection molding issues database."""
    
    return [
        # FRENCH MANUAL-BASED ISSUES (from HyPET5e/HPP5e manual metadata)
        {
            'problem': 'La machine n\'accepte pas les commandes ou ne démarre pas',
            'cause': 'Problème d\'alimentation électrique, disjoncteur déclenché, ou dysfonctionnement du système de contrôle',
            'solution': 'Vérifier les connexions d\'alimentation, vérifier l\'état du disjoncteur, redémarrer le système de contrôle. Consulter la section réinitialisation de puissance du manuel.',
            'machine_type': 'HyPET5e',
            'source': 'manuals',
            'manual_language': 'French',
            'manufacturer': 'Husky Injection Molding Systems Limited'
        },
        {
            'problem': 'La température du moule ne se stabilise pas',
            'cause': 'Régulateur de température défectueux, raccordement du tuyau d\'eau desserré, ou dysfonctionnement du capteur de température',
            'solution': 'Vérifier les connexions du système de chauffage, nettoyer les filtres d\'eau, vérifier le calibrage du capteur de température, remplacer la sonde si nécessaire.',
            'machine_type': 'HyPET5e',
            'source': 'manuals',
            'manual_language': 'French',
            'manufacturer': 'Husky Injection Molding Systems Limited'
        },
        {
            'problem': 'Bruit anormal ou vibration excessive pendant le moulage',
            'cause': 'Platine mal alignée, vis de serrage desserrées, ou usure des paliers',
            'solution': 'Vérifier tous les boulons de montage, vérifier l\'alignement du moule, inspecter les paliers pour usure, resserrer les fixations selon le couple de serrage spécifié.',
            'machine_type': 'HyPET5e',
            'source': 'manuals',
            'manual_language': 'French',
            'manufacturer': 'Husky Injection Molding Systems Limited'
        },
        {
            'problem': 'Fuite d\'huile hydraulique observée',
            'cause': 'Joint d\'étanchéité dégradé, tuyau endommagé, ou connexion desserrée',
            'solution': 'Localiser la source de la fuite, vérifier l\'intégrité des tuyaux hydrauliques, remplacer les joints d\'étanchéité usés, vérifier la pression du système.',
            'machine_type': 'HyPET5e',
            'source': 'manuals',
            'manual_language': 'French',
            'manufacturer': 'Husky Injection Molding Systems Limited'
        },
        {
            'problem': 'Pression hydraulique instable ou faible',
            'cause': 'Filtre d\'huile encrassé, fuite du système, pompe défectueuse, ou clapet défectueux',
            'solution': 'Contrôler le niveau et la qualité de l\'huile, remplacer le filtre d\'huile, vérifier les fuites, calibrer la pression de la pompe, remplacer la pompe si défectueuse.',
            'machine_type': 'HyPET5e',
            'source': 'manuals',
            'manual_language': 'French',
            'manufacturer': 'Husky Injection Molding Systems Limited'
        },
        {
            'problem': 'Surpression ou arrêt du cycle de moulage',
            'cause': 'Moule obstrué, accumulation de résidu plastique, pression insuffisante, ou dysfonctionnement du capteur',
            'solution': 'Nettoyer le moule, vérifier le système de ventilation du moule, augmenter la pression de fermeture si nécessaire, remplacer le capteur de pression.',
            'machine_type': 'HyPET5e',
            'source': 'manuals',
            'manual_language': 'French',
            'manufacturer': 'Husky Injection Molding Systems Limited'
        },
        {
            'problem': 'Électrode de température brûlée ou défectueuse',
            'cause': 'Court-circuit, isolation endommagée, ou surcharge électrique',
            'solution': 'Vérifier la résistance de l\'électrode avec un multimètre, remplacer l\'électrode défectueuse, vérifier le système électrique pour les défauts.',
            'machine_type': 'HyPET5e',
            'source': 'manuals',
            'manual_language': 'French',
            'manufacturer': 'Husky Injection Molding Systems Limited'
        },
        {
            'problem': 'Codes d\'erreur affichés sur le panneau de contrôle',
            'cause': 'Dysfonctionnement du capteur, interférence électrique, défaut logiciel, ou fusible grillé',
            'solution': 'Documenter le code d\'erreur, consulter le tableau des codes d\'erreur du manuel, effectuer les diagnostiques recommandés, remplacer les fusibles si nécessaire.',
            'machine_type': 'HyPET5e',
            'source': 'manuals',
            'manual_language': 'French',
            'manufacturer': 'Husky Injection Molding Systems Limited'
        },
        {
            'problem': 'Pièces injectées présentent des défauts de qualité (retassures, bulles d\'air)',
            'cause': 'Température du moule insuffisante, pression d\'injection inadéquate, temps de refroidissement insuffisant, ou présence d\'humidité dans la matière',
            'solution': 'Augmenter la température du moule progressivement, ajuster la pression et la vitesse d\'injection, prolonger le temps de refroidissement, vérifier l\'humidité du plastique avec un humidimètre.',
            'machine_type': 'HyPET5e',
            'source': 'manuals',
            'manual_language': 'French',
            'manufacturer': 'Husky Injection Molding Systems Limited'
        },
        {
            'problem': 'La buse se bouche ou s\'écoule entre les cycles',
            'cause': 'Température de buse incorrecte, plastique non compatible, résidu accumulé, ou problème de thermocouple',
            'solution': 'Vérifier et ajuster la température de la buse, utiliser le bon type de plastique, nettoyer la buse régulièrement, vérifier le calibrage du thermocouple, remplacer si défectueux.',
            'machine_type': 'HyPET5e',
            'source': 'manuals',
            'manual_language': 'French',
            'manufacturer': 'Husky Injection Molding Systems Limited'
        },
        
        # COMMUNITY KNOWLEDGE - General Injection Molding Issues
        {
            'problem': 'Injection mold not closing properly or with excessive pressure',
            'cause': 'Mold alignment issues, hydraulic pressure loss, or controller malfunction',
            'solution': 'Inspect mold for debris, verify hydraulic pressure settings, check mold clamping mechanism, perform preventive maintenance.',
            'machine_type': 'HyPET5e',
            'source': 'community_knowledge',
            'url': 'https://www.plastics.com/articles/injection-molding-troubleshooting'
        },
        {
            'problem': 'Screw slipping or rotation problems',
            'cause': 'Inadequate material shear, loose drive coupling, or wear on the screw barrel',
            'solution': 'Check screw-barrel clearance, verify material specifications, inspect coupling for wear, adjust rotation speed.',
            'machine_type': 'HyPET5e',
            'source': 'community_knowledge',
            'url': 'https://www.injection-molding.net/screw-troubleshooting'
        },
        {
            'problem': 'Inconsistent injection speed or pressure',
            'cause': 'Proportional valve malfunction, pressure transducer error, or pump wear',
            'solution': 'Calibrate pressure sensors, test proportional valves, verify pump displacement, check for hydraulic fluid contamination.',
            'machine_type': 'HyPET5e',
            'source': 'community_knowledge',
            'url': 'https://www.spe.org/cpe/article/injection-molding-pressure-control'
        },
        {
            'problem': 'Cooling system not maintaining set temperature',
            'cause': 'Chiller malfunction, scaled cooling lines, or sensor drift',
            'solution': 'Flush cooling circuit with descaling agent, verify chiller operation, recalibrate temperature sensor, check thermostatic valve.',
            'machine_type': 'HyPET5e',
            'source': 'community_knowledge',
            'url': 'https://www.cooling-system-guide.com/mold-temperature-control'
        },
        {
            'problem': 'Ejector pins stuck or moving slowly',
            'cause': 'Accumulation of plastic residue, bearing wear, or return spring failure',
            'solution': 'Clean ejector mechanism, lubricate with appropriate grease, inspect and replace springs, verify actuator pressure.',
            'machine_type': 'HyPET5e',
            'source': 'community_knowledge',
            'url': 'https://www.mold-maintenance.com/ejector-pin-guide'
        },
        
        # COMMON INDUSTRIAL EQUIPMENT ISSUES
        {
            'problem': 'Machine produces loud noise or vibration',
            'cause': 'Loose bearing, misalignment, or worn component',
            'solution': 'Check all mounting bolts and fasteners, verify machine alignment with precision level, inspect bearings for excessive play, replace worn parts as needed.',
            'machine_type': 'HyPET5e',
            'source': 'community_knowledge',
            'category': 'mechanical'
        },
        {
            'problem': 'Overheating during extended operation',
            'cause': 'Insufficient cooling, blocked ventilation, or excessive friction',
            'solution': 'Clean cooling vents and filters, ensure adequate ventilation space, check lubrication levels and type, reduce load or operating duration.',
            'machine_type': 'HyPET5e',
            'source': 'community_knowledge',
            'category': 'thermal'
        },
        {
            'problem': 'Unexpected emergency stop or shutdown',
            'cause': 'Safety interlock triggered, thermal overload, or electrical fault',
            'solution': 'Check all safety switches and sensors, verify thermal sensor calibration, inspect electrical connections, reset system after clearing fault.',
            'machine_type': 'HyPET5e',
            'source': 'community_knowledge',
            'category': 'safety'
        },
        {
            'problem': 'Control panel display shows error codes',
            'cause': 'Sensor malfunction, electrical noise, or firmware issue',
            'solution': 'Document error code number, consult error code table in manual, perform sensor diagnostic test, update firmware if available.',
            'machine_type': 'HyPET5e',
            'source': 'community_knowledge',
            'category': 'electrical'
        },
        {
            'problem': 'Power loss or unexpected system resets',
            'cause': 'Unstable power supply, loose electrical connections, or UPS malfunction',
            'solution': 'Install surge protector or UPS, check all electrical connections for corrosion, verify input voltage stability, upgrade power supply if needed.',
            'machine_type': 'HyPET5e',
            'source': 'community_knowledge',
            'category': 'electrical'
        },
        {
            'problem': 'Pressure or flow rate dropping gradually',
            'cause': 'Seal degradation, hose damage, or internal leakage in pump',
            'solution': 'Inspect all seals and gaskets, check hoses for cracks or splits, monitor fluid level, replace worn components, refill with correct fluid type.',
            'machine_type': 'HyPET5e',
            'source': 'community_knowledge',
            'category': 'hydraulic'
        },
    ]


def main():
    """Generate the machine issues JSON dataset."""
    
    # Get all issues
    issues = get_injection_molding_issues()
    
    # Save to JSON
    workspace_root = Path(__file__).parent.parent.parent
    output_path = workspace_root / "giba" / "backend" / "data" / "machine_issues.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(issues, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Saved {len(issues)} issues to {output_path}")
    
    # Print summary
    print("\n" + "="*80)
    print("SUMMARY: Machine Issues Dataset Generation")
    print("="*80)
    print(f"Total issues: {len(issues)}")
    print(f"Machine type: HyPET5e (Injection Molding Machine)")
    print(f"Manufacturer: Husky Injection Molding Systems Limited")
    print(f"Output file: {output_path}")
    
    print(f"\nIssues by source:")
    source_count = {}
    for issue in issues:
        source = issue.get('source', 'unknown')
        source_count[source] = source_count.get(source, 0) + 1
    
    for source, count in sorted(source_count.items()):
        print(f"  - {source}: {count} issues")
    
    print("\n" + "="*80)
    print("SAMPLE ISSUES:")
    print("="*80)
    for i, issue in enumerate(issues[:5], 1):
        print(f"\n{i}. {issue['problem']}")
        print(f"   Cause: {issue['cause']}")
        print(f"   Solution: {issue['solution'][:100]}...")
        print(f"   Machine: {issue['machine_type']} | Source: {issue['source']}")
    
    print(f"\n... and {len(issues) - 5} more issues in the dataset")
    print("\n" + "="*80)
    
    return output_path


if __name__ == "__main__":
    output = main()
