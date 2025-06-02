"""
Enhanced Chord Detection Fixes
Addresses major/minor conflicts and high chord change rates identified in diagnostic analysis
"""

import numpy as np
import librosa
from typing import List, Dict, Tuple, Optional
from scipy import signal
from collections import Counter
import math

class ImprovedChordDetector:
    """Improved chord detection to fix major/minor conflicts and noise issues"""
    
    def __init__(self):
        # Note names
        self.note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        # Enhanced chord templates with better major/minor separation
        self.chord_templates = self._create_improved_chord_templates()
        
        # Key profiles for improved key detection
        self.key_profiles = {
            'major': [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
            'minor': [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
        }
        
        # Improved detection parameters
        self.config = {
            'major_minor_threshold': 0.15,  # Increased threshold for major/minor distinction
            'confidence_threshold': 0.7,    # Higher confidence threshold
            'temporal_window_size': 5,      # Larger smoothing window
            'noise_gate_threshold': 0.15,   # Higher noise gate
            'stability_factor': 0.8,        # Stability requirement for chord changes
            'harmonic_weight': 2.0,         # Weight harmonic content more heavily
        }
    
    def _create_improved_chord_templates(self) -> Dict[str, np.ndarray]:
        """Create improved chord templates with better major/minor separation"""
        templates = {}
        
        # Enhanced major chord template (emphasize major third and fifth)
        major_template = np.array([1.0, 0.1, 0.1, 0.1, 0.8, 0.1, 0.1, 0.6, 0.1, 0.1, 0.1, 0.1])
        
        # Enhanced minor chord template (emphasize minor third and fifth)  
        minor_template = np.array([1.0, 0.1, 0.1, 0.8, 0.1, 0.1, 0.1, 0.6, 0.1, 0.1, 0.1, 0.1])
        
        # Diminished chord template
        dim_template = np.array([1.0, 0.1, 0.1, 0.8, 0.1, 0.1, 0.8, 0.1, 0.1, 0.1, 0.1, 0.1])
        
        # Augmented chord template  
        aug_template = np.array([1.0, 0.1, 0.1, 0.1, 0.8, 0.1, 0.1, 0.1, 0.8, 0.1, 0.1, 0.1])
        
        # Sus2 chord template
        sus2_template = np.array([1.0, 0.1, 0.8, 0.1, 0.1, 0.1, 0.1, 0.6, 0.1, 0.1, 0.1, 0.1])
        
        # Sus4 chord template
        sus4_template = np.array([1.0, 0.1, 0.1, 0.1, 0.1, 0.8, 0.1, 0.6, 0.1, 0.1, 0.1, 0.1])
        
        # Generate all chord templates
        for i, note in enumerate(self.note_names):
            # Major chords
            templates[f"{note} major"] = np.roll(major_template, i)
            # Minor chords  
            templates[f"{note} minor"] = np.roll(minor_template, i)
            # Diminished chords
            templates[f"{note} dim"] = np.roll(dim_template, i)
            # Augmented chords
            templates[f"{note} aug"] = np.roll(aug_template, i)
            # Sus2 chords
            templates[f"{note} sus2"] = np.roll(sus2_template, i)
            # Sus4 chords
            templates[f"{note} sus4"] = np.roll(sus4_template, i)
        
        return templates
    
    def detect_chords_improved(self, y: np.ndarray, sr: int, hop_length: int = 2048) -> List[Dict]:
        """
        Improved chord detection with fixes for major/minor conflicts
        """
        # Apply harmonic-percussive separation for cleaner harmonic content
        y_harmonic, _ = librosa.effects.hpss(y, margin=(1.0, 5.0))
        
        # Enhanced chromagram with higher resolution
        chroma = librosa.feature.chroma_cqt(
            y=y_harmonic, 
            sr=sr, 
            hop_length=hop_length,
            bins_per_octave=24,  # Reduced from 36 for better stability
            n_octaves=5,         # Reduced from 6 for focus on main harmonic range
            fmin=librosa.note_to_hz('C2')  # Start from C2 instead of C1
        )
        
        # Apply spectral enhancement
        chroma = self._apply_improved_spectral_enhancement(chroma)
        
        # Normalize chroma vectors
        chroma = librosa.util.normalize(chroma, axis=0)
        
        # Get time axis
        times = librosa.frames_to_time(
            np.arange(chroma.shape[1]), 
            sr=sr, 
            hop_length=hop_length
        )
        
        # Detect chords using improved template matching
        chord_sequence = []
        confidence_scores = []
        
        for i in range(chroma.shape[1]):
            chroma_vector = chroma[:, i]
            
            # Skip frames with very low energy (improved noise gate)
            if np.sum(chroma_vector) < self.config['noise_gate_threshold']:
                chord_sequence.append("N")  # No chord
                confidence_scores.append(0.0)
                continue
            
            # Find best matching chord template with improved scoring
            best_chord, best_score = self._improved_template_matching(chroma_vector)
            
            chord_sequence.append(best_chord)
            confidence_scores.append(best_score)
        
        # Apply improved temporal smoothing
        smoothed_chords = self._apply_improved_temporal_smoothing(
            chord_sequence, confidence_scores, times
        )
        
        # Build result with enhanced confidence filtering
        result = []
        for i, (time, chord, confidence) in enumerate(zip(times, smoothed_chords, confidence_scores)):
            # Only include chords with sufficient confidence
            if confidence >= self.config['confidence_threshold'] or chord == "N":
                result.append({
                    "time": float(time),
                    "chord": chord,
                    "confidence": float(confidence)
                })
        
        return result
    
    def _improved_template_matching(self, chroma_vector: np.ndarray) -> Tuple[str, float]:
        """Improved template matching with better major/minor distinction"""
        best_chord = "N"
        best_score = 0.0
        
        major_scores = {}
        minor_scores = {}
        other_scores = {}
        
        for chord_name, template in self.chord_templates.items():
            # Compute both correlation and cosine similarity
            correlation = np.corrcoef(chroma_vector, template)[0, 1]
            if np.isnan(correlation):
                correlation = 0.0
            
            # Cosine similarity with harmonic weighting
            cosine_sim = np.dot(chroma_vector, template) / (
                np.linalg.norm(chroma_vector) * np.linalg.norm(template) + 1e-8
            )
            
            # Combined score with harmonic emphasis
            combined_score = (correlation + cosine_sim * self.config['harmonic_weight']) / (1 + self.config['harmonic_weight'])
            
            # Separate scores by chord type
            if 'major' in chord_name:
                root = chord_name.split()[0]
                major_scores[root] = max(major_scores.get(root, 0), combined_score)
            elif 'minor' in chord_name:
                root = chord_name.split()[0]
                minor_scores[root] = max(minor_scores.get(root, 0), combined_score)
            else:
                other_scores[chord_name] = combined_score
        
        # Find best chord with improved major/minor logic
        all_candidates = []
        
        # Check major vs minor for each root
        for root in self.note_names:
            major_score = major_scores.get(root, 0)
            minor_score = minor_scores.get(root, 0)
            
            # Only consider a chord if it has sufficient score difference
            if major_score > minor_score + self.config['major_minor_threshold']:
                all_candidates.append((f"{root} major", major_score))
            elif minor_score > major_score + self.config['major_minor_threshold']:
                all_candidates.append((f"{root} minor", minor_score))
            # If scores are too close, prefer the higher one only if significantly above threshold
            elif max(major_score, minor_score) > self.config['confidence_threshold']:
                if major_score > minor_score:
                    all_candidates.append((f"{root} major", major_score))
                else:
                    all_candidates.append((f"{root} minor", minor_score))
        
        # Add other chord types
        for chord_name, score in other_scores.items():
            if score > self.config['confidence_threshold']:
                all_candidates.append((chord_name, score))
        
        # Find the best candidate
        if all_candidates:
            best_chord, best_score = max(all_candidates, key=lambda x: x[1])
        
        return best_chord, best_score
    
    def _apply_improved_spectral_enhancement(self, chroma: np.ndarray) -> np.ndarray:
        """Apply improved spectral enhancement to reduce noise"""
        # Apply median filtering to reduce noise (increased kernel size)
        chroma_enhanced = np.copy(chroma)
        for i in range(chroma.shape[0]):
            chroma_enhanced[i, :] = signal.medfilt(chroma[i, :], kernel_size=5)
        
        # Apply harmonic enhancement with improved algorithm
        for i in range(chroma.shape[1]):
            # Enhance harmonic peaks with better normalization
            peak_value = np.max(chroma_enhanced[:, i])
            if peak_value > 0:
                # Apply gentler enhancement to prevent over-emphasis
                chroma_enhanced[:, i] = np.power(chroma_enhanced[:, i] / peak_value, 0.7) * peak_value
        
        return chroma_enhanced
    
    def _apply_improved_temporal_smoothing(self, chord_sequence: List[str], 
                                         confidence_scores: List[float], 
                                         times: np.ndarray) -> List[str]:
        """Apply improved temporal smoothing to reduce chord noise"""
        if len(chord_sequence) < self.config['temporal_window_size']:
            return chord_sequence
        
        smoothed = chord_sequence.copy()
        window_size = self.config['temporal_window_size']
        
        for i in range(window_size // 2, len(chord_sequence) - window_size // 2):
            # Get window around current position
            window_start = i - window_size // 2
            window_end = i + window_size // 2 + 1
            
            window_chords = chord_sequence[window_start:window_end]
            window_confidences = confidence_scores[window_start:window_end]
            
            # Count chord occurrences in window, weighted by confidence and stability
            chord_votes = {}
            for j, chord in enumerate(window_chords):
                if chord != "N":  # Skip "no chord" votes
                    weight = window_confidences[j] * self.config['stability_factor']
                    chord_votes[chord] = chord_votes.get(chord, 0) + weight
            
            # Only smooth if we have strong evidence and current confidence is low
            if chord_votes and confidence_scores[i] < self.config['confidence_threshold']:
                best_chord = max(chord_votes, key=chord_votes.get)
                
                # Only smooth if the alternative has strong support
                if chord_votes[best_chord] > len(window_chords) * 0.4:
                    smoothed[i] = best_chord
        
        return smoothed
    
    def detect_key_improved(self, y: np.ndarray, sr: int) -> Tuple[str, float]:
        """Improved key detection using multiple methods"""
        # Get enhanced chromagram for entire audio
        chroma = librosa.feature.chroma_cqt(
            y=y, 
            sr=sr, 
            bins_per_octave=24,
            n_octaves=5
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
