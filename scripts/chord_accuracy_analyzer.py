#!/usr/bin/env python3
"""
Chord Accuracy Analyzer
Analyzes chord detection results to identify accuracy issues and patterns
"""

import json
import os
import sys
import argparse
from collections import Counter, defaultdict
import numpy as np

class ChordAccuracyAnalyzer:
    def __init__(self):
        self.chord_patterns = defaultdict(int)
        self.confidence_stats = {}
        self.transition_patterns = defaultdict(int)
        
    def analyze_chord_file(self, file_path: str) -> dict:
        """Analyze a single chord detection file"""
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            chords = data.get('chords', [])
            if not chords:
                return {"error": "No chords found in file"}
            
            analysis = {
                "file": os.path.basename(file_path),
                "total_chords": len(chords),
                "unique_chords": len(set(c.get('chord', 'N') for c in chords)),
                "has_confidence": any('confidence' in c for c in chords),
                "chord_distribution": Counter(c.get('chord', 'N') for c in chords),
                "potential_issues": []
            }
            
            # Analyze confidence scores if available
            confidences = [c.get('confidence', 0) for c in chords if 'confidence' in c]
            if confidences:
                analysis["confidence_stats"] = {
                    "mean": np.mean(confidences),
                    "std": np.std(confidences),
                    "min": np.min(confidences),
                    "max": np.max(confidences),
                    "low_confidence_count": sum(1 for c in confidences if c < 0.5)
                }
            
            # Identify potential issues
            self._identify_issues(chords, analysis)
            
            return analysis
            
        except Exception as e:
            return {"error": f"Failed to analyze {file_path}: {str(e)}"}
    
    def _identify_issues(self, chords: list, analysis: dict):
        """Identify potential chord detection issues"""
        issues = []
        
        # Check for excessive chord changes (noise)
        if len(chords) > 1:
            changes = 0
            for i in range(1, len(chords)):
                if chords[i].get('chord') != chords[i-1].get('chord'):
                    changes += 1
            
            change_rate = changes / len(chords)
            if change_rate > 0.8:
                issues.append(f"High chord change rate: {change_rate:.2f} (potential noise)")
        
        # Check for unusual chord progressions
        chord_names = [c.get('chord', 'N') for c in chords]
        unusual_chords = [c for c in chord_names if 'aug' in c or 'dim' in c]
        if len(unusual_chords) > len(chords) * 0.3:
            issues.append(f"High rate of unusual chords: {len(unusual_chords)}/{len(chords)}")
        
        # Check for key consistency issues
        major_chords = [c for c in chord_names if 'major' in c]
        minor_chords = [c for c in chord_names if 'minor' in c]
        
        if major_chords and minor_chords:
            major_roots = set(c.split()[0] for c in major_chords)
            minor_roots = set(c.split()[0] for c in minor_chords)
            
            # Check for conflicting major/minor on same root
            conflicts = major_roots.intersection(minor_roots)
            if len(conflicts) > 2:
                issues.append(f"Major/minor conflicts on roots: {conflicts}")
        
        # Check confidence patterns
        if 'confidence_stats' in analysis:
            stats = analysis['confidence_stats']
            if stats['mean'] < 0.6:
                issues.append(f"Low average confidence: {stats['mean']:.3f}")
            if stats['low_confidence_count'] > len(chords) * 0.4:
                issues.append(f"High low-confidence detections: {stats['low_confidence_count']}/{len(chords)}")
        
        analysis['potential_issues'] = issues
    
    def analyze_directory(self, directory: str) -> dict:
        """Analyze all chord files in a directory"""
        results = {
            "directory": directory,
            "files_analyzed": 0,
            "files_with_issues": 0,
            "common_issues": Counter(),
            "file_analyses": []
        }
        
        if not os.path.exists(directory):
            return {"error": f"Directory {directory} does not exist"}
        
        json_files = [f for f in os.listdir(directory) if f.endswith('.json')]
        
        for filename in json_files:
            file_path = os.path.join(directory, filename)
            file_analysis = self.analyze_chord_file(file_path)
            
            results["file_analyses"].append(file_analysis)
            results["files_analyzed"] += 1
            
            if file_analysis.get('potential_issues'):
                results["files_with_issues"] += 1
                for issue in file_analysis['potential_issues']:
                    # Extract issue type (first part before colon)
                    issue_type = issue.split(':')[0]
                    results["common_issues"][issue_type] += 1
        
        return results
    
    def generate_report(self, analysis: dict) -> str:
        """Generate a human-readable report"""
        report = []
        report.append("=== CHORD DETECTION ACCURACY ANALYSIS ===\n")
        
        if "error" in analysis:
            report.append(f"ERROR: {analysis['error']}")
            return "\n".join(report)
        
        if "directory" in analysis:
            # Directory analysis
            report.append(f"Directory: {analysis['directory']}")
            report.append(f"Files analyzed: {analysis['files_analyzed']}")
            report.append(f"Files with issues: {analysis['files_with_issues']}")
            report.append(f"Issue rate: {analysis['files_with_issues']/analysis['files_analyzed']*100:.1f}%\n")
            
            if analysis.get('common_issues'):
                report.append("COMMON ISSUES:")
                for issue, count in analysis['common_issues'].most_common():
                    report.append(f"  - {issue}: {count} files")
                report.append("")
            
            # Show files with most issues
            problematic_files = [f for f in analysis['file_analyses'] 
                               if f.get('potential_issues') and not f.get('error')]
            
            if problematic_files:
                report.append("FILES WITH MOST ISSUES:")
                for file_info in sorted(problematic_files, 
                                      key=lambda x: len(x.get('potential_issues', [])), 
                                      reverse=True)[:5]:
                    report.append(f"  {file_info['file']}:")
                    for issue in file_info['potential_issues']:
                        report.append(f"    - {issue}")
                    if 'confidence_stats' in file_info:
                        stats = file_info['confidence_stats']
                        report.append(f"    - Avg confidence: {stats['mean']:.3f}")
                report.append("")
        else:
            # Single file analysis
            report.append(f"File: {analysis['file']}")
            report.append(f"Total chords: {analysis['total_chords']}")
            report.append(f"Unique chords: {analysis['unique_chords']}")
            report.append(f"Has confidence scores: {analysis['has_confidence']}")
            
            if analysis.get('confidence_stats'):
                stats = analysis['confidence_stats']
                report.append(f"Confidence - Mean: {stats['mean']:.3f}, "
                            f"Std: {stats['std']:.3f}, Range: {stats['min']:.3f}-{stats['max']:.3f}")
                report.append(f"Low confidence detections: {stats['low_confidence_count']}")
            
            if analysis.get('potential_issues'):
                report.append("\nPOTENTIAL ISSUES:")
                for issue in analysis['potential_issues']:
                    report.append(f"  - {issue}")
            else:
                report.append("\nNo significant issues detected.")
        
        return "\n".join(report)

def main():
    parser = argparse.ArgumentParser(description="Analyze chord detection accuracy")
    parser.add_argument("path", help="Path to JSON file or directory to analyze")
    parser.add_argument("--output", help="Output file for report")
    
    args = parser.parse_args()
    
    analyzer = ChordAccuracyAnalyzer()
    
    if os.path.isfile(args.path):
        analysis = analyzer.analyze_chord_file(args.path)
    elif os.path.isdir(args.path):
        analysis = analyzer.analyze_directory(args.path)
    else:
        print(f"Error: {args.path} is not a valid file or directory")
        sys.exit(1)
    
    report = analyzer.generate_report(analysis)
    
    if args.output:
        with open(args.output, 'w') as f:
            f.write(report)
        print(f"Report saved to {args.output}")
    else:
        print(report)

if __name__ == "__main__":
    main()
