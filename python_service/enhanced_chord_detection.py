"""
Enhanced Chord Detection Module for Harmonix
Implements multiple advanced chord detection algorithms for improved accuracy
"""

import numpy as np
import librosa
from typing import List, Dict, Tuple, Optional
from scipy import signal
from collections import Counter
import math

class EnhancedChordDetector:
    """Advanced chord detection with multiple algorithms and temporal smoothing"""
    
    def __init__(self):
        # Note names
        self.note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        # Enhanced chord templates for better recognition
        self.chord_templates = self._create_enhanced_chord_templates()
        
        # Key profiles for improved key detection
        self.key_profiles = {
            'major': [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
            'minor': [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
        }
        
    def _create_enhanced_chord_templates(self) -> Dict:
        """Create enhanced chord templates with more chord types"""
        templates = {}
        
        # Major chord templates (root, third, fifth)
        major_template = [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0]
        
        # Minor chord templates (root, minor third, fifth)
        minor_template = [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0]
        
        # Diminished chord templates (root, minor third, diminished fifth)
        dim_template = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0]
        
        # Augmented chord templates (root, major third, augmented fifth)
        aug_template = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
        
        # Sus2 chord templates (root, second, fifth)
        sus2_template = [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0]
        
        # Sus4 chord templates (root, fourth, fifth)
        sus4_template = [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0]
        
        # Create all chord templates for all roots
        for i in range(12):
            note = self.note_names[i]
            
            # Rotate templates to different roots
            templates[f"{note} major"] = np.roll(major_template, i)
            templates[f"{note} minor"] = np.roll(minor_template, i)
            templates[f"{note} dim"] = np.roll(dim_template, i)
            templates[f"{note} aug"] = np.roll(aug_template, i)
            templates[f"{note} sus2"] = np.roll(sus2_template, i)
            templates[f"{note} sus4"] = np.roll(sus4_template, i)
            
        return templates
    
    def detect_chords_enhanced(self, y: np.ndarray, sr: int, hop_length: int = 4096) -> List[Dict]:
        """
        Enhanced chord detection using multiple methods and temporal smoothing
        """
        # Apply harmonic-percussive separation for cleaner harmonic content
        y_harmonic, _ = librosa.effects.hpss(y, margin=(1.0, 5.0))
        
        # Enhanced chromagram with higher resolution
        chroma = librosa.feature.chroma_cqt(
            y=y_harmonic, 
            sr=sr, 
            hop_length=hop_length,
            bins_per_octave=36,  # Higher resolution
            n_octaves=6,
            fmin=librosa.note_to_hz('C1')
        )
        
        # Apply spectral rolloff to focus on harmonic content
        chroma = self._apply_spectral_enhancement(chroma)
        
        # Normalize chroma vectors
        chroma = librosa.util.normalize(chroma, axis=0)
        
        # Get time axis
        times = librosa.frames_to_time(
            np.arange(chroma.shape[1]), 
            sr=sr, 
            hop_length=hop_length
        )
        
        # Detect chords using template matching
        chord_sequence = []
        confidence_scores = []
        
        for i in range(chroma.shape[1]):
            chroma_vector = chroma[:, i]
            
            # Skip frames with very low energy
            if np.sum(chroma_vector) < 0.1:
                chord_sequence.append("N")  # No chord
                confidence_scores.append(0.0)
                continue
            
            # Find best matching chord template
            best_chord, confidence = self._match_chord_template(chroma_vector)
            chord_sequence.append(best_chord)
            confidence_scores.append(confidence)
        
        # Apply temporal smoothing to reduce noise
        smoothed_chords = self._apply_temporal_smoothing(
            chord_sequence, confidence_scores, times
        )
        
        # Convert to output format
        result_chords = []
        for i, (time, chord) in enumerate(zip(times, smoothed_chords)):
            result_chords.append({
                "time": float(time),
                "chord": chord,
                "confidence": float(confidence_scores[i]) if i < len(confidence_scores) else 0.0
            })
        
        return result_chords
    
    def _apply_spectral_enhancement(self, chroma: np.ndarray) -> np.ndarray:
        """Apply spectral enhancement to improve chroma quality"""
        # Apply median filtering to reduce noise
        for i in range(chroma.shape[0]):
            chroma[i, :] = signal.medfilt(chroma[i, :], kernel_size=3)
        
        # Enhance harmonic peaks
        chroma_enhanced = np.copy(chroma)
        for i in range(chroma.shape[1]):
            # Apply local maxima enhancement
            local_max = np.max(chroma[:, i])
            if local_max > 0:
                chroma_enhanced[:, i] = np.power(chroma[:, i] / local_max, 0.5) * local_max
        
        return chroma_enhanced
    
    def _match_chord_template(self, chroma_vector: np.ndarray) -> Tuple[str, float]:
        """Match chroma vector against chord templates"""
        best_chord = "N"
        best_score = 0.0
        
        for chord_name, template in self.chord_templates.items():
            # Calculate correlation with template
            correlation = np.corrcoef(chroma_vector, template)[0, 1]
            
            # Handle NaN correlation (when one vector is all zeros)
            if np.isnan(correlation):
                correlation = 0.0
            
            # Calculate cosine similarity as well
            norm_chroma = np.linalg.norm(chroma_vector)
            norm_template = np.linalg.norm(template)
            
            if norm_chroma > 0 and norm_template > 0:
                cosine_sim = np.dot(chroma_vector, template) / (norm_chroma * norm_template)
            else:
                cosine_sim = 0.0
            
            # Combine correlation and cosine similarity
            combined_score = 0.7 * correlation + 0.3 * cosine_sim
            
            if combined_score > best_score:
                best_score = combined_score
                best_chord = chord_name
        
        return best_chord, best_score
    
    def _apply_temporal_smoothing(self, chord_sequence: List[str], 
                                 confidence_scores: List[float], 
                                 times: np.ndarray) -> List[str]:
        """Apply temporal smoothing to reduce chord detection noise"""
        if len(chord_sequence) < 3:
            return chord_sequence
        
        smoothed = chord_sequence.copy()
        window_size = 3  # Use 3-frame window for smoothing
        
        for i in range(1, len(chord_sequence) - 1):
            # Get window around current position
            window_start = max(0, i - window_size // 2)
            window_end = min(len(chord_sequence), i + window_size // 2 + 1)
            
            window_chords = chord_sequence[window_start:window_end]
            window_confidences = confidence_scores[window_start:window_end]
            
            # Count chord occurrences in window, weighted by confidence
            chord_votes = {}
            for j, chord in enumerate(window_chords):
                if chord != "N":  # Skip "no chord" votes
                    weight = window_confidences[j] if j < len(window_confidences) else 0.5
                    chord_votes[chord] = chord_votes.get(chord, 0) + weight
            
            # If we have enough evidence for a different chord, use it
            if chord_votes:
                best_chord = max(chord_votes, key=chord_votes.get)
                
                # Only smooth if the confidence is reasonable
                if (chord_votes[best_chord] > len(window_chords) * 0.3 and 
                    confidence_scores[i] < 0.8):
                    smoothed[i] = best_chord
        
        return smoothed
    
    def detect_key_enhanced(self, y: np.ndarray, sr: int) -> Tuple[str, float]:
        """Enhanced key detection using multiple methods"""
        # Get enhanced chromagram for entire audio
        chroma = librosa.feature.chroma_cqt(
            y=y, 
            sr=sr, 
            bins_per_octave=36,
            n_octaves=6
        )
        
        # Average chroma across time
        avg_chroma = np.mean(chroma, axis=1)
        
        # Normalize
        avg_chroma = avg_chroma / np.sum(avg_chroma)
        
        best_key = "C major"
        best_score = 0.0
        
        # Test all 24 keys (12 major + 12 minor)
        for i in range(12):
            note = self.note_names[i]
            
            # Test major key
            major_profile = np.roll(self.key_profiles['major'], i)
            major_profile = np.array(major_profile) / np.sum(major_profile)
            major_score = np.corrcoef(avg_chroma, major_profile)[0, 1]
            
            if not np.isnan(major_score) and major_score > best_score:
                best_score = major_score
                best_key = f"{note} major"
            
            # Test minor key
            minor_profile = np.roll(self.key_profiles['minor'], i)
            minor_profile = np.array(minor_profile) / np.sum(minor_profile)
            minor_score = np.corrcoef(avg_chroma, minor_profile)[0, 1]
            
            if not np.isnan(minor_score) and minor_score > best_score:
                best_score = minor_score
                best_key = f"{note} minor"
        
        return best_key, best_score

class ImprovedTonalFragment:
    """Improved version of Tonal_Fragment with enhanced algorithms"""
    
    def __init__(self, waveform, sr, tstart=None, tend=None, enhanced_detector=None):
        self.waveform = waveform
        self.sr = sr
        self.tstart = tstart
        self.tend = tend
        
        if enhanced_detector is None:
            self.enhanced_detector = EnhancedChordDetector()
        else:
            self.enhanced_detector = enhanced_detector
        
        # Extract segment
        if self.tstart is not None:
            self.tstart_samples = librosa.time_to_samples(self.tstart, sr=self.sr)
        else:
            self.tstart_samples = 0
            
        if self.tend is not None:
            self.tend_samples = librosa.time_to_samples(self.tend, sr=self.sr)
        else:
            self.tend_samples = len(self.waveform)
        
        self.y_segment = self.waveform[self.tstart_samples:self.tend_samples]
        
        # Only analyze if we have enough audio data
        if len(self.y_segment) > sr * 0.1:  # At least 0.1 seconds
            self._analyze_segment()
        else:
            self.key = "N"  # No chord for too short segments
            self.bestcorr = 0.0
            self.confidence = 0.0
    
    def _analyze_segment(self):
        """Analyze the audio segment for chord content"""
        # Use enhanced key detection
        self.key, self.bestcorr = self.enhanced_detector.detect_key_enhanced(
            self.y_segment, self.sr
        )
        
        # For very short segments, also try single-frame chord detection
        if len(self.y_segment) < self.sr * 2:  # Less than 2 seconds
            # Get single chord estimate
            chroma = librosa.feature.chroma_cqt(
                y=self.y_segment,
                sr=self.sr,
                bins_per_octave=36
            )
            
            if chroma.shape[1] > 0:
                avg_chroma = np.mean(chroma, axis=1)
                chord, confidence = self.enhanced_detector._match_chord_template(avg_chroma)
                
                # Use enhanced result if confidence is high enough
                if confidence > self.bestcorr:
                    self.key = chord
                    self.bestcorr = confidence
        
        self.confidence = self.bestcorr

class ChordProgressionAnalyzer:
    """Analyzes chord progressions to fix detection errors and improve accuracy"""
    
    def __init__(self):
        # Common chord progressions for error correction
        self.common_progressions = {
            'major': [
                ['I', 'V', 'vi', 'IV'],  # Pop progression
                ['I', 'vi', 'IV', 'V'],  # 50s progression
                ['vi', 'IV', 'I', 'V'],  # Emotional pop
                ['I', 'IV', 'V', 'I'],   # Classical
                ['ii', 'V', 'I'],        # Jazz turnaround
                ['I', 'vi', 'ii', 'V'],  # Circle of fifths
            ],
            'minor': [
                ['i', 'VII', 'VI', 'VII'],  # Modal minor
                ['i', 'iv', 'V', 'i'],      # Harmonic minor
                ['i', 'VI', 'III', 'VII'],  # Natural minor
                ['i', 'v', 'VI', 'iv'],     # Dorian mode
            ]
        }
        
        # Chord substitution rules for error correction
        self.substitutions = {
            'major': {
                'iii': ['I', 'vi'],  # iii can substitute I or vi
                'V7': ['V'],         # V7 can be simplified to V
                'vi': ['I'],         # vi can substitute I
                'IV': ['ii'],        # IV can substitute ii
            },
            'minor': {
                'III': ['i'],        # III can substitute i
                'VI': ['iv'],        # VI can substitute iv
                'VII': ['V'],        # VII can substitute V
            }
        }
    
    def analyze_and_correct_progression(self, chords: List[Dict], detected_key: str) -> List[Dict]:
        """Analyze chord progression and correct obvious errors"""
        if len(chords) < 4:
            return chords
        
        # Parse key
        key_parts = detected_key.split()
        if len(key_parts) != 2:
            return chords
        
        key_root = key_parts[0]
        key_mode = key_parts[1]
        
        # Convert chords to Roman numerals for analysis
        roman_chords = self._convert_to_roman_numerals(chords, key_root, key_mode)
        
        # Apply progression-based corrections
        corrected_romans = self._apply_progression_corrections(roman_chords, key_mode)
        
        # Convert back to chord names
        corrected_chords = self._convert_from_roman_numerals(
            corrected_romans, chords, key_root, key_mode
        )
        
        return corrected_chords
    
    def _convert_to_roman_numerals(self, chords: List[Dict], key_root: str, key_mode: str) -> List[str]:
        """Convert chord sequence to Roman numerals"""
        romans = []
        
        # Define scale degrees
        note_to_degree = {
            'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
            'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
        }
        
        key_degree = note_to_degree.get(key_root, 0)
        
        for chord in chords:
            chord_name = chord.get('chord', 'N')
            if chord_name == 'N' or chord_name == '':
                romans.append('N')
                continue
            
            # Parse chord name
            chord_parts = chord_name.split()
            if len(chord_parts) < 2:
                romans.append('N')
                continue
            
            chord_root = chord_parts[0]
            chord_quality = chord_parts[1]
            
            # Calculate degree
            chord_degree = note_to_degree.get(chord_root, 0)
            relative_degree = (chord_degree - key_degree) % 12
            
            # Convert to Roman numeral based on key mode
            roman = self._degree_to_roman(relative_degree, chord_quality, key_mode)
            romans.append(roman)
        
        return romans
    
    def _degree_to_roman(self, degree: int, chord_quality: str, key_mode: str) -> str:
        """Convert scale degree to Roman numeral"""
        degree_map = {
            0: 'I', 1: 'bII', 2: 'II', 3: 'bIII', 4: 'III', 5: 'IV',
            6: 'bV', 7: 'V', 8: 'bVI', 9: 'VI', 10: 'bVII', 11: 'VII'
        }
        
        roman = degree_map.get(degree, 'I')
        
        # Adjust for key mode and chord quality
        if key_mode == 'minor':
            minor_adjustments = {
                'I': 'i', 'II': 'ii°', 'III': 'III', 'IV': 'iv',
                'V': 'v', 'VI': 'VI', 'VII': 'VII'
            }
            roman = minor_adjustments.get(roman, roman)
        
        # Adjust for chord quality
        if chord_quality == 'minor' and key_mode == 'major':
            if roman in ['I', 'IV', 'V']:
                roman = roman.lower()
        elif chord_quality == 'major' and key_mode == 'minor':
            if roman in ['i', 'iv', 'v']:
                roman = roman.upper()
        
        return roman
    
    def _apply_progression_corrections(self, romans: List[str], key_mode: str) -> List[str]:
        """Apply progression-based error corrections"""
        corrected = romans.copy()
        
        # Look for impossible progressions and fix them
        for i in range(1, len(corrected) - 1):
            current = corrected[i]
            prev_chord = corrected[i-1]
            next_chord = corrected[i+1]
            
            # Skip 'N' (no chord) entries
            if current == 'N' or prev_chord == 'N' or next_chord == 'N':
                continue
            
            # Check for melodically unlikely jumps
            if self._is_unlikely_progression(prev_chord, current, next_chord, key_mode):
                # Try to find a better chord that fits the progression
                better_chord = self._find_better_chord(prev_chord, next_chord, key_mode)
                if better_chord:
                    corrected[i] = better_chord
        
        return corrected
    
    def _is_unlikely_progression(self, prev_chord: str, current: str, next_chord: str, key_mode: str) -> bool:
        """Check if a progression is melodically unlikely"""
        # Define unlikely progressions (these are rarely used in common music)
        unlikely_patterns = [
            ('I', 'bII', 'I'),   # Flat II is uncommon in major
            ('i', 'II', 'i'),    # Major II is uncommon in minor
            ('V', 'bVI', 'V'),   # Flat VI after V is uncommon
        ]
        
        pattern = (prev_chord, current, next_chord)
        return pattern in unlikely_patterns
    
    def _find_better_chord(self, prev_chord: str, next_chord: str, key_mode: str) -> Optional[str]:
        """Find a better chord to connect two chords in a progression"""
        # Common connecting chords
        connections = {
            'major': {
                ('I', 'V'): ['vi', 'IV'],
                ('V', 'I'): ['vi', 'IV'],
                ('vi', 'IV'): ['I', 'V'],
                ('IV', 'I'): ['V', 'vi'],
            },
            'minor': {
                ('i', 'V'): ['iv', 'VI'],
                ('V', 'i'): ['iv', 'VI'],
                ('iv', 'i'): ['V', 'VII'],
                ('VI', 'i'): ['VII', 'iv'],
            }
        }
        
        pattern = (prev_chord, next_chord)
        possible_chords = connections.get(key_mode, {}).get(pattern, [])
        
        return possible_chords[0] if possible_chords else None
    
    def _convert_from_roman_numerals(self, romans: List[str], original_chords: List[Dict], 
                                   key_root: str, key_mode: str) -> List[Dict]:
        """Convert Roman numerals back to chord names"""
        corrected_chords = []
        
        # Note mapping
        notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        key_index = notes.index(key_root)
        
        for i, (roman, original) in enumerate(zip(romans, original_chords)):
            if roman == 'N':
                corrected_chords.append(original)
                continue
            
            # Convert Roman numeral back to chord name
            chord_name = self._roman_to_chord_name(roman, key_root, key_mode, notes, key_index)
            
            # Create new chord dict with corrected name
            corrected_chord = original.copy()
            corrected_chord['chord'] = chord_name
            corrected_chords.append(corrected_chord)
        
        return corrected_chords
    
    def _roman_to_chord_name(self, roman: str, key_root: str, key_mode: str, 
                           notes: List[str], key_index: int) -> str:
        """Convert Roman numeral to chord name"""
        # Roman numeral to degree mapping
        roman_to_degree = {
            'I': 0, 'i': 0, 'bII': 1, 'II': 2, 'ii': 2, 'ii°': 2,
            'bIII': 3, 'III': 4, 'iii': 4, 'IV': 5, 'iv': 5,
            'bV': 6, 'V': 7, 'v': 7, 'bVI': 8, 'VI': 9, 'vi': 9,
            'bVII': 10, 'VII': 11, 'vii°': 11
        }
        
        degree = roman_to_degree.get(roman, 0)
        chord_root_index = (key_index + degree) % 12
        chord_root = notes[chord_root_index]
        
        # Determine chord quality from Roman numeral
        if roman.islower() or '°' in roman:
            quality = 'minor'
        else:
            quality = 'major'
        
        return f"{chord_root} {quality}"
