"""
Advanced Music Intelligence Module for Harmonix
Provides smart analysis beyond basic chord detection
"""

import numpy as np
import librosa
from typing import Dict, List, Tuple, Optional
import json
from dataclasses import dataclass
from collections import Counter
import re

@dataclass
class ProgressionAnalysis:
    """Smart analysis of chord progressions"""
    function_analysis: List[str]  # Roman numeral analysis
    key_modulations: List[Dict]   # Detected key changes
    common_patterns: List[str]    # Identified pattern names
    complexity_score: float       # 0-1 complexity rating
    suggested_substitutions: List[Dict]
    mood_indicators: List[str]

@dataclass
class StructuralAnalysis:
    """Smart structural analysis of songs"""
    sections: List[Dict]          # Verse, Chorus, Bridge detection
    repetition_score: float       # How repetitive is the song
    development_arc: List[str]    # How the song develops
    climax_points: List[float]    # Timestamps of musical climax

class MusicIntelligenceEngine:
    """Advanced AI for music theory analysis and suggestions"""
    
    def __init__(self):
        # Music theory knowledge base
        self.chord_functions = {
            'major': {
                'I': ['tonic', 'stable', 'home'],
                'ii': ['supertonic', 'predominant', 'leading to V'],
                'iii': ['mediant', 'tonic substitute', 'weak'],
                'IV': ['subdominant', 'predominant', 'strong'],
                'V': ['dominant', 'unstable', 'leading to I'],
                'vi': ['submediant', 'tonic substitute', 'relative minor'],
                'vii°': ['leading tone', 'dominant function', 'unstable']
            },
            'minor': {
                'i': ['tonic', 'stable', 'home'],
                'ii°': ['supertonic', 'predominant', 'weak'],
                'III': ['mediant', 'relative major', 'stable'],
                'iv': ['subdominant', 'predominant', 'emotional'],
                'V': ['dominant', 'unstable', 'leading to i'],
                'VI': ['submediant', 'stable', 'major brightness'],
                'VII': ['subtonic', 'modal', 'rock tendency']
            }
        }
        
        # Common progression patterns
        self.progression_patterns = {
            'I-V-vi-IV': 'Pop/Rock Progression (very common)',
            'vi-IV-I-V': 'Emotional Pop Progression',
            'I-vi-ii-V': 'Circle of Fifths',
            'I-vi-IV-V': '50s Progression',
            'ii-V-I': 'Jazz Turnaround',
            'I-VII-IV-I': 'Modal Rock Progression',
            'vi-V-IV-V': 'Emotional Build',
            'I-V-IV-I': 'Classic Rock',
        }
        
        # Mood indicators based on chord patterns
        self.mood_patterns = {
            'happy': ['I', 'IV', 'V', 'major'],
            'sad': ['vi', 'ii', 'minor', 'dim'],
            'mysterious': ['vii°', 'ii°', 'aug'],
            'powerful': ['I', 'V', 'IV'],
            'nostalgic': ['vi', 'IV', 'I'],
            'dreamy': ['iii', 'vi', 'ii']
        }

    def analyze_progression_intelligence(self, chords: List[Dict], detected_key: str) -> ProgressionAnalysis:
        """Perform intelligent analysis of chord progression"""
        if not chords or not detected_key:
            return ProgressionAnalysis([], [], [], 0.0, [], [])
        
        # Parse key
        key_root, key_mode = self._parse_key(detected_key)
        if not key_root or not key_mode:
            return ProgressionAnalysis([], [], [], 0.0, [], [])
        
        # Convert chords to Roman numerals
        roman_numerals = self._chords_to_roman_numerals(chords, key_root, key_mode)
        
        # Detect common patterns
        patterns = self._detect_patterns(roman_numerals)
        
        # Analyze key modulations
        modulations = self._detect_modulations(chords, key_root, key_mode)
        
        # Calculate complexity score
        complexity = self._calculate_complexity(chords, roman_numerals)
        
        # Generate substitution suggestions
        substitutions = self._suggest_substitutions(chords, roman_numerals, key_root, key_mode)
        
        # Determine mood indicators
        moods = self._analyze_mood(roman_numerals, key_mode)
        
        return ProgressionAnalysis(
            function_analysis=roman_numerals,
            key_modulations=modulations,
            common_patterns=patterns,
            complexity_score=complexity,
            suggested_substitutions=substitutions,
            mood_indicators=moods
        )

    def analyze_song_structure(self, chords: List[Dict], tempo: float = None) -> StructuralAnalysis:
        """Intelligent structural analysis of the song"""
        if not chords:
            return StructuralAnalysis([], 0.0, [], [])
        
        # Detect sections based on chord patterns
        sections = self._detect_sections(chords)
        
        # Calculate repetition score
        repetition = self._calculate_repetition_score(chords)
        
        # Analyze development arc
        development = self._analyze_development(chords, sections)
        
        # Find climax points (using chord density and complexity)
        climax_points = self._find_climax_points(chords, tempo)
        
        return StructuralAnalysis(
            sections=sections,
            repetition_score=repetition,
            development_arc=development,
            climax_points=climax_points
        )

    def generate_practice_suggestions(self, chords: List[Dict], key: str, tempo: float) -> Dict:
        """Generate intelligent practice recommendations"""
        suggestions = {
            'difficulty_level': self._assess_difficulty(chords, tempo),
            'recommended_techniques': [],
            'practice_sections': [],
            'chord_transitions': [],
            'tempo_recommendations': {}
        }
        
        # Analyze difficult transitions
        difficult_transitions = self._find_difficult_transitions(chords)
        suggestions['chord_transitions'] = difficult_transitions
        
        # Recommend practice techniques
        techniques = self._recommend_techniques(chords, key, tempo)
        suggestions['recommended_techniques'] = techniques
        
        # Suggest practice sections
        practice_sections = self._identify_practice_sections(chords)
        suggestions['practice_sections'] = practice_sections
        
        # Tempo recommendations
        suggestions['tempo_recommendations'] = {
            'original_tempo': tempo,
            'practice_tempo': max(tempo * 0.6, 60),  # 60% of original or minimum 60 BPM
            'target_tempo': tempo * 1.1,  # 10% faster for mastery
            'tempo_progression': [tempo * 0.6, tempo * 0.8, tempo, tempo * 1.1]
        }
        
        return suggestions

    def _parse_key(self, key_str: str) -> Tuple[Optional[str], Optional[str]]:
        """Parse key string into root and mode"""
        if not key_str:
            return None, None
        
        parts = key_str.strip().split()
        if len(parts) >= 2:
            root = parts[0]
            mode = parts[1].lower()
            return root, mode
        return None, None

    def _chords_to_roman_numerals(self, chords: List[Dict], key_root: str, key_mode: str) -> List[str]:
        """Convert chord names to Roman numeral analysis"""
        chromatic_scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        # Get scale degrees for the key
        root_index = chromatic_scale.index(key_root) if key_root in chromatic_scale else 0
        
        roman_numerals = []
        for chord_obj in chords:
            chord_name = chord_obj.get('chord', '')
            if not chord_name:
                continue
                
            # Extract root note from chord
            chord_root = self._extract_chord_root(chord_name)
            if not chord_root:
                continue
            
            # Calculate scale degree
            if chord_root in chromatic_scale:
                chord_index = chromatic_scale.index(chord_root)
                degree = (chord_index - root_index) % 12
                
                # Convert to Roman numeral based on mode
                roman = self._degree_to_roman(degree, key_mode, chord_name)
                roman_numerals.append(roman)
        
        return roman_numerals

    def _extract_chord_root(self, chord_name: str) -> Optional[str]:
        """Extract root note from chord name"""
        if not chord_name:
            return None
        
        # Handle chord names like "C major", "Am", "F#7", etc.
        chord_name = chord_name.strip()
        
        # Check for sharp/flat in second position
        if len(chord_name) >= 2 and chord_name[1] in ['#', 'b']:
            return chord_name[:2]
        else:
            return chord_name[0] if chord_name else None

    def _degree_to_roman(self, degree: int, mode: str, chord_name: str) -> str:
        """Convert scale degree to Roman numeral"""
        romans = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
        
        if mode == 'major':
            roman = romans[degree] if degree < len(romans) else 'I'
        else:  # minor mode
            minor_romans = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']
            roman = minor_romans[degree] if degree < len(minor_romans) else 'i'
        
        # Add chord quality indicators
        if 'major' in chord_name.lower() and roman.islower():
            roman = roman.upper()
        elif 'minor' in chord_name.lower() and roman.isupper():
            roman = roman.lower()
        
        # Add extensions
        if '7' in chord_name:
            roman += '7'
        if 'dim' in chord_name.lower():
            roman += '°'
        if 'aug' in chord_name.lower():
            roman += '+'
        
        return roman

    def _detect_patterns(self, roman_numerals: List[str]) -> List[str]:
        """Detect common chord progression patterns"""
        if len(roman_numerals) < 3:
            return []
        
        patterns_found = []
        
        # Check for known patterns
        roman_str = '-'.join(roman_numerals[:8])  # Check first 8 chords
        
        for pattern, description in self.progression_patterns.items():
            if pattern in roman_str:
                patterns_found.append(description)
        
        # Check for sequences
        if self._is_sequence(roman_numerals):
            patterns_found.append("Sequential Progression")
        
        return patterns_found

    def _is_sequence(self, romans: List[str]) -> bool:
        """Check if progression contains sequences"""
        if len(romans) < 4:
            return False
        
        # Look for repeating patterns
        for pattern_length in [2, 3]:
            for i in range(len(romans) - pattern_length * 2 + 1):
                pattern = romans[i:i + pattern_length]
                next_pattern = romans[i + pattern_length:i + pattern_length * 2]
                if pattern == next_pattern:
                    return True
        
        return False

    def _detect_modulations(self, chords: List[Dict], key_root: str, key_mode: str) -> List[Dict]:
        """Detect key modulations in the progression"""
        # This is a simplified implementation
        # In practice, you'd analyze chord relationships and pivot chords
        modulations = []
        
        # Look for patterns that suggest modulation
        # This would be much more sophisticated in a full implementation
        
        return modulations

    def _calculate_complexity(self, chords: List[Dict], romans: List[str]) -> float:
        """Calculate harmonic complexity score (0-1)"""
        if not chords:
            return 0.0
        
        complexity_factors = []
        
        # Chord diversity
        unique_chords = len(set([c.get('chord', '') for c in chords]))
        total_chords = len(chords)
        diversity = unique_chords / max(total_chords, 1)
        complexity_factors.append(diversity)
        
        # Extended chords
        extended_count = sum(1 for c in chords if any(ext in c.get('chord', '') for ext in ['7', '9', '11', '13', 'sus', 'add']))
        extension_ratio = extended_count / max(total_chords, 1)
        complexity_factors.append(extension_ratio)
        
        # Chromatic alterations
        altered_count = sum(1 for c in chords if any(alt in c.get('chord', '') for alt in ['#', 'b', 'dim', 'aug']))
        alteration_ratio = altered_count / max(total_chords, 1)
        complexity_factors.append(alteration_ratio)
        
        return min(sum(complexity_factors) / len(complexity_factors), 1.0)

    def _suggest_substitutions(self, chords: List[Dict], romans: List[str], key_root: str, key_mode: str) -> List[Dict]:
        """Generate intelligent chord substitution suggestions"""
        substitutions = []
        
        for i, chord_obj in enumerate(chords):
            chord = chord_obj.get('chord', '')
            if not chord or i >= len(romans):
                continue
            
            roman = romans[i]
            suggestions = []
            
            # Common substitutions based on function
            if roman == 'I':
                suggestions.extend(['vi (relative minor)', 'iii (mediant substitute)'])
            elif roman == 'V':
                suggestions.extend(['vii° (leading tone)', 'V7 (dominant 7th)', 'tritone substitution'])
            elif roman == 'vi':
                suggestions.extend(['I (relative major)', 'IV (plagal relation)'])
            elif roman == 'IV':
                suggestions.extend(['ii (subdominant substitute)', 'IV7 (subdominant 7th)'])
            
            if suggestions:
                substitutions.append({
                    'original_chord': chord,
                    'position': i,
                    'time': chord_obj.get('time', 0),
                    'suggestions': suggestions[:3]  # Limit to top 3
                })
        
        return substitutions[:10]  # Limit total suggestions

    def _analyze_mood(self, romans: List[str], key_mode: str) -> List[str]:
        """Analyze mood indicators from progression"""
        mood_scores = {mood: 0 for mood in self.mood_patterns.keys()}
        
        for roman in romans:
            for mood, indicators in self.mood_patterns.items():
                if any(indicator in roman for indicator in indicators):
                    mood_scores[mood] += 1
        
        # Add mode influence
        if key_mode == 'minor':
            mood_scores['sad'] += 2
            mood_scores['mysterious'] += 1
        else:
            mood_scores['happy'] += 2
            mood_scores['powerful'] += 1
        
        # Return top moods
        sorted_moods = sorted(mood_scores.items(), key=lambda x: x[1], reverse=True)
        return [mood for mood, score in sorted_moods if score > 0][:3]

    def _detect_sections(self, chords: List[Dict]) -> List[Dict]:
        """Detect song sections (verse, chorus, etc.)"""
        sections = []
        
        if len(chords) < 8:
            return [{'name': 'Complete Song', 'start': 0, 'end': len(chords) - 1}]
        
        # Simple section detection based on chord pattern repetition
        # This is a basic implementation - could be much more sophisticated
        section_length = 8  # Assume 8-chord sections
        
        for i in range(0, len(chords), section_length):
            end_idx = min(i + section_length - 1, len(chords) - 1)
            section_name = f"Section {len(sections) + 1}"
            
            # Try to identify section type based on position and patterns
            if i == 0:
                section_name = "Intro/Verse"
            elif i < len(chords) // 2:
                section_name = "Verse"
            else:
                section_name = "Chorus/Bridge"
            
            sections.append({
                'name': section_name,
                'start': i,
                'end': end_idx,
                'start_time': chords[i].get('time', 0),
                'end_time': chords[end_idx].get('time', 0)
            })
        
        return sections

    def _calculate_repetition_score(self, chords: List[Dict]) -> float:
        """Calculate how repetitive the chord progression is"""
        if len(chords) < 4:
            return 0.0
        
        chord_sequence = [c.get('chord', '') for c in chords]
        
        # Count repeated patterns
        pattern_counts = Counter()
        
        for pattern_length in [2, 3, 4]:
            for i in range(len(chord_sequence) - pattern_length + 1):
                pattern = tuple(chord_sequence[i:i + pattern_length])
                pattern_counts[pattern] += 1
        
        # Calculate repetition score
        total_patterns = sum(pattern_counts.values())
        repeated_patterns = sum(count - 1 for count in pattern_counts.values() if count > 1)
        
        return repeated_patterns / max(total_patterns, 1)

    def _analyze_development(self, chords: List[Dict], sections: List[Dict]) -> List[str]:
        """Analyze how the song develops harmonically"""
        development = []
        
        if len(sections) <= 1:
            return ["Static - single section"]
        
        # Compare harmonic complexity between sections
        section_complexities = []
        for section in sections:
            section_chords = chords[section['start']:section['end'] + 1]
            complexity = self._calculate_complexity(section_chords, [])
            section_complexities.append(complexity)
        
        # Analyze development pattern
        if len(section_complexities) >= 2:
            if section_complexities[-1] > section_complexities[0]:
                development.append("Building complexity")
            elif section_complexities[-1] < section_complexities[0]:
                development.append("Resolving/Simplifying")
            else:
                development.append("Stable complexity")
        
        return development

    def _find_climax_points(self, chords: List[Dict], tempo: Optional[float]) -> List[float]:
        """Find musical climax points in the song"""
        if not chords:
            return []
        
        climax_points = []
        
        # Simple climax detection based on chord density changes
        # In practice, this would analyze multiple factors
        
        # For now, identify points where chord changes are most frequent
        if len(chords) > 10:
            # Find the middle section as potential climax
            middle_start = len(chords) // 3
            middle_end = 2 * len(chords) // 3
            
            if middle_start < len(chords):
                climax_time = chords[middle_start].get('time', 0)
                climax_points.append(climax_time)
        
        return climax_points

    def _assess_difficulty(self, chords: List[Dict], tempo: float) -> Dict:
        """Assess the technical difficulty of the piece"""
        if not chords:
            return {"overall_difficulty": "easy", "difficulty_factors": []}
        
        difficulty_factors = []
        difficulty_score = 0
        
        # Factor 1: Chord complexity
        complex_chords = 0
        for chord in chords:
            chord_name = chord.get('chord', '').lower()
            if any(marker in chord_name for marker in ['7', '9', '11', '13', 'sus', 'aug', 'dim']):
                complex_chords += 1
        
        chord_complexity = complex_chords / len(chords)
        if chord_complexity > 0.3:
            difficulty_score += 2
            difficulty_factors.append("Complex chord types")
        elif chord_complexity > 0.1:
            difficulty_score += 1
            difficulty_factors.append("Some extended chords")
        
        # Factor 2: Tempo
        if tempo > 140:
            difficulty_score += 2
            difficulty_factors.append("Fast tempo")
        elif tempo > 120:
            difficulty_score += 1
            difficulty_factors.append("Moderate tempo")
        
        # Factor 3: Harmonic rhythm
        harmonic_analysis = self._analyze_harmonic_rhythm(chords)
        change_frequency = harmonic_analysis.get("change_frequency", 0)
        
        if change_frequency > 1.0:
            difficulty_score += 2
            difficulty_factors.append("Rapid chord changes")
        elif change_frequency > 0.5:
            difficulty_score += 1
            difficulty_factors.append("Moderate chord changes")
        
        # Factor 4: Key signature complexity
        key_name = chords[0].get('key', '') if chords else ''
        if any(key_part in key_name.lower() for key_part in ['#', 'b', 'sharp', 'flat']):
            if key_name.lower().count('#') + key_name.lower().count('b') > 2:
                difficulty_score += 2
                difficulty_factors.append("Complex key signature")
            else:
                difficulty_score += 1
                difficulty_factors.append("Key signature with accidentals")
        
        # Determine overall difficulty
        if difficulty_score >= 6:
            overall_difficulty = "very hard"
        elif difficulty_score >= 4:
            overall_difficulty = "hard"
        elif difficulty_score >= 2:
            overall_difficulty = "moderate"
        else:
            overall_difficulty = "easy"
        
        return {
            "overall_difficulty": overall_difficulty,
            "difficulty_score": difficulty_score,
            "difficulty_factors": difficulty_factors,
            "tempo_factor": tempo,
            "chord_complexity": round(chord_complexity, 2),
            "harmonic_rhythm": harmonic_analysis.get("rhythm_pattern", "static")
        }

    def _find_difficult_transitions(self, chords: List[Dict]) -> List[Dict]:
        """Identify potentially difficult chord transitions"""
        difficult_transitions = []
        
        for i in range(len(chords) - 1):
            current_chord = chords[i].get('chord', '')
            next_chord = chords[i + 1].get('chord', '')
            
            if not current_chord or not next_chord:
                continue
            
            # Identify difficult transitions (this is simplified)
            # In practice, you'd analyze finger positions, common fingerings, etc.
            
            difficulty_factors = []
            
            # Check for large jumps in root notes
            current_root = self._extract_chord_root(current_chord)
            next_root = self._extract_chord_root(next_chord)
            
            if current_root and next_root:
                # This is a simplified check - would need proper chord position analysis
                if current_root != next_root:
                    difficulty_factors.append("Root change")
            
            # Check for chord type changes
            if 'major' in current_chord and 'minor' in next_chord:
                difficulty_factors.append("Major to minor")
            elif 'minor' in current_chord and 'major' in next_chord:
                difficulty_factors.append("Minor to major")
            
            if difficulty_factors:
                difficult_transitions.append({
                    'from_chord': current_chord,
                    'to_chord': next_chord,
                    'time': chords[i].get('time', 0),
                    'factors': difficulty_factors
                })
        
        return difficult_transitions[:5]  # Return top 5 difficult transitions

    def _recommend_techniques(self, chords: List[Dict], key: str, tempo: float) -> List[str]:
        """Recommend practice techniques based on analysis"""
        techniques = []
        
        # Tempo-based recommendations
        if tempo > 120:
            techniques.append("Practice with metronome at slower tempo")
            techniques.append("Focus on clean chord transitions")
        
        # Complexity-based recommendations
        complexity = self._calculate_complexity(chords, [])
        if complexity > 0.6:
            techniques.append("Practice chord shapes separately")
            techniques.append("Use chord substitutions for difficult chords")
        
        # Pattern-based recommendations
        if len(chords) > 20:
            techniques.append("Break song into smaller sections")
            techniques.append("Identify repeating patterns")
        
        techniques.append("Practice strumming patterns separately")
        techniques.append("Use backing tracks for timing")
        
        return techniques

    def _identify_practice_sections(self, chords: List[Dict]) -> List[Dict]:
        """Identify specific sections that need focused practice"""
        practice_sections = []
        
        # Find sections with chord changes
        if len(chords) > 8:
            # Identify rapid chord change sections
            for i in range(0, len(chords) - 4, 4):
                section_chords = chords[i:i + 4]
                unique_in_section = len(set([c.get('chord', '') for c in section_chords]))
                
                if unique_in_section >= 3:  # 3 or more different chords in 4 beats
                    practice_sections.append({
                        'name': f"Rapid changes (measure {i//4 + 1})",
                        'start_time': section_chords[0].get('time', 0),
                        'end_time': section_chords[-1].get('time', 0),
                        'difficulty': "High",
                        'focus': "Chord transitions"
                    })
        
        return practice_sections

    def _analyze_harmonic_rhythm(self, chords: List[Dict]) -> Dict:
        """Analyze the harmonic rhythm (how often chords change)"""
        if not chords:
            return {"rhythm_pattern": "static", "change_frequency": 0}
        
        # Calculate time differences between chord changes
        chord_changes = []
        prev_chord = None
        
        for chord in chords:
            current_chord = chord.get('chord', '')
            if prev_chord and current_chord != prev_chord:
                chord_changes.append(chord.get('time', 0))
            prev_chord = current_chord
        
        if len(chord_changes) < 2:
            return {"rhythm_pattern": "static", "change_frequency": 0}
        
        # Calculate average change frequency
        total_duration = chords[-1].get('time', 0) - chords[0].get('time', 0)
        change_frequency = len(chord_changes) / total_duration if total_duration > 0 else 0
        
        # Classify rhythm pattern
        if change_frequency > 1.0:
            rhythm_pattern = "rapid"
        elif change_frequency > 0.5:
            rhythm_pattern = "moderate"
        elif change_frequency > 0.25:
            rhythm_pattern = "slow"
        else:
            rhythm_pattern = "static"
        
        return {
            "rhythm_pattern": rhythm_pattern,
            "change_frequency": round(change_frequency, 2),
            "total_changes": len(chord_changes)
        }

    def _analyze_mood_progression(self, chords: List[Dict], key: str) -> Dict:
        """Analyze how the mood progresses throughout the song"""
        if not chords:
            return {"overall_mood": "neutral", "mood_changes": []}
        
        # Convert chords to roman numerals for analysis
        roman_numerals = self.chord_to_roman(chords, key)
        key_mode = 'minor' if 'minor' in key.lower() else 'major'
        
        mood_timeline = []
        window_size = 4  # Analyze mood in 4-chord windows
        
        for i in range(0, len(roman_numerals), window_size):
            window = roman_numerals[i:i + window_size]
            section_mood = self._analyze_mood(window, key_mode)
            
            mood_timeline.append({
                "time_range": f"{chords[i].get('time', 0)}-{chords[min(i + window_size - 1, len(chords) - 1)].get('time', 0)}",
                "mood": section_mood
            })
        
        # Determine overall mood trend
        all_moods = []
        for section in mood_timeline:
            all_moods.extend(section["mood"])
        
        mood_counts = Counter(all_moods)
        dominant_mood = mood_counts.most_common(1)[0][0] if mood_counts else "neutral"
        
        return {
            "overall_mood": dominant_mood,
            "mood_changes": mood_timeline,
            "mood_stability": len(set(all_moods)) / len(all_moods) if all_moods else 1
        }

    def chord_to_roman(self, chords: List[Dict], key: str) -> List[str]:
        """Convert chord names to Roman numeral analysis"""
        if not chords or not key:
            return []
        
        # Simplified chord to Roman numeral mapping for C major as example
        # This is a basic implementation - could be enhanced with proper music theory
        key_name = key.lower().replace(' major', '').replace(' minor', '').strip()
        is_minor = 'minor' in key.lower()
        
        # Basic major key Roman numerals (C major as reference)
        major_romans = {
            'c': 'I', 'd': 'ii', 'e': 'iii', 'f': 'IV', 
            'g': 'V', 'a': 'vi', 'b': 'vii°'
        }
        
        # Basic minor key Roman numerals (A minor as reference)
        minor_romans = {
            'a': 'i', 'b': 'ii°', 'c': 'III', 'd': 'iv',
            'e': 'v', 'f': 'VI', 'g': 'VII'
        }
        
        romans = []
        for chord in chords:
            chord_name = chord.get('chord', '').lower()
            
            # Extract root note from chord name
            root = ''
            if len(chord_name) > 0:
                root = chord_name[0]
                
            # Simple mapping (this could be much more sophisticated)
            if is_minor:
                roman = minor_romans.get(root, 'I')
            else:
                roman = major_romans.get(root, 'I')
                
            # Handle minor chords in major keys
            if 'minor' in chord_name and not is_minor:
                if roman in ['I', 'IV', 'V']:
                    roman = roman.lower()
            
            romans.append(roman)
        
        return romans
