"""
Optimized Real-Time Chord Detection Module

This module provides optimized chord detection for real-time audio processing
with significant performance improvements while maintaining accuracy.
"""

import numpy as np
import librosa
import time
from typing import Tuple, Dict, List
from collections import deque

class OptimizedRealTimeChordDetector:
    def __init__(self):
        # Chord templates cache for faster lookup
        self.chord_templates = self._initialize_chord_templates()
        
        # Performance optimizations
        self.chord_history = deque(maxlen=5)  # Keep recent chord history
        self.last_chord = "N"
        self.confidence_threshold = 0.15  # Adjusted for normalized templates
        
        # Caching for repeated computations
        self.chroma_params_cache = {}
        
        # Musical context for prediction
        self.chord_transitions = {
            'A major': ['D major', 'E major', 'F#m minor'],
            'D major': ['G major', 'A major', 'Bm minor'],
            'E major': ['A major', 'B major', 'C#m minor'],
            'G major': ['C major', 'D major', 'Em minor'],
            'C major': ['F major', 'G major', 'Am minor'],
            'F major': ['Bb major', 'C major', 'Dm minor'],
        }
    
    def _initialize_chord_templates(self) -> Dict[str, np.ndarray]:
        """Initialize optimized chord templates"""
        templates = {}
        
        # Major chord templates (root, major third, perfect fifth)
        major_pattern = [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0]  # C major template
        
        chord_roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        for i, root in enumerate(chord_roots):
            # Major chord
            major_template = np.roll(major_pattern, i)
            templates[f'{root} major'] = np.array(major_template, dtype=np.float32)
            
            # Minor chord (flatten the third)
            minor_template = major_template.copy()
            minor_third_pos = (i + 3) % 12
            major_third_pos = (i + 4) % 12
            minor_template[major_third_pos] = 0
            minor_template[minor_third_pos] = 1
            templates[f'{root}m minor'] = np.array(minor_template, dtype=np.float32)
            
            # Sus4 chord (raise the third to fourth)
            sus4_template = major_template.copy()
            sus4_template[major_third_pos] = 0
            sus4_template[(i + 5) % 12] = 1
            templates[f'{root} sus4'] = np.array(sus4_template, dtype=np.float32)
            
            # Sus2 chord (lower the third to second)
            sus2_template = major_template.copy()
            sus2_template[major_third_pos] = 0
            sus2_template[(i + 2) % 12] = 1
            templates[f'{root} sus2'] = np.array(sus2_template, dtype=np.float32)
        
        # Normalize all templates
        for chord in templates:
            template = templates[chord]
            if np.sum(template) > 0:
                templates[chord] = template / np.sum(template)
        
        return templates
    
    def _extract_optimized_chroma(self, audio: np.ndarray, sr: int) -> np.ndarray:
        """Extract chroma features with optimized parameters for speed"""
        try:
            # Use cached parameters or compute new ones
            audio_len = len(audio)
            cache_key = f"{audio_len}_{sr}"
            
            if cache_key not in self.chroma_params_cache:
                # Optimize parameters based on audio length with CQT requirements
                # For 4-octave CQT, hop_length must be multiple of 2^3 = 8
                hop_length = max(256, (audio_len // 16) // 8 * 8)  # Round to multiple of 8
                n_fft = min(1024, audio_len // 2)
                self.chroma_params_cache[cache_key] = (hop_length, n_fft)
            else:
                hop_length, n_fft = self.chroma_params_cache[cache_key]
            
            # Fast chroma extraction with reduced resolution
            chroma = librosa.feature.chroma_cqt(
                y=audio,
                sr=sr,
                hop_length=hop_length,
                bins_per_octave=12,  # Reduced from 24
                n_octaves=4,         # Reduced from 5
                fmin=librosa.note_to_hz('C2'),
                norm=2
            )
            
            # Average across time and normalize
            avg_chroma = np.mean(chroma, axis=1)
            if np.sum(avg_chroma) > 0:
                avg_chroma = avg_chroma / np.sum(avg_chroma)
            
            return avg_chroma
            
        except Exception as e:
            print(f"Optimized chroma extraction error: {e}")
            return np.zeros(12)
    
    def _predict_likely_chords(self, current_chord: str) -> List[str]:
        """Predict likely next chords for faster matching"""
        if current_chord in self.chord_transitions:
            return self.chord_transitions[current_chord]
        return []
    
    def detect_chord_fast(self, audio: np.ndarray, sr: int) -> Tuple[str, float]:
        """Fast chord detection optimized for real-time processing"""
        start_time = time.time()
        
        # Apply harmonic-percussive separation for cleaner signal
        try:
            y_harmonic, _ = librosa.effects.hpss(audio, margin=(1.0, 5.0))
        except:
            y_harmonic = audio  # Fallback if HPSS fails
        
        # Extract optimized chroma features
        chroma = self._extract_optimized_chroma(y_harmonic, sr)
        
        # Quick energy check
        if np.sum(chroma) < 0.05:
            return "N", 0.0
        
        # Get likely chords for faster search
        predicted_chords = self._predict_likely_chords(self.last_chord)
        
        best_chord = "N"
        best_score = 0.0
        
        # Check predicted chords first (faster)
        for chord in predicted_chords:
            if chord in self.chord_templates:
                template = self.chord_templates[chord]
                # Use correlation for better template matching
                score = np.corrcoef(chroma, template)[0, 1]
                if np.isnan(score):
                    score = 0.0
                if score > best_score:
                    best_score = score
                    best_chord = chord
        
        # If no good prediction match, check all chords
        if best_score < self.confidence_threshold:
            for chord, template in self.chord_templates.items():
                score = np.corrcoef(chroma, template)[0, 1]
                if np.isnan(score):
                    score = 0.0
                if score > best_score:
                    best_score = score
                    best_chord = chord
        
        # Apply confidence threshold
        confidence = min(1.0, best_score)
        if confidence < self.confidence_threshold:
            best_chord = "N"
            confidence = 0.0
        
        # Temporal smoothing - avoid rapid chord changes
        if best_chord != self.last_chord and confidence > 0:
            # Require higher confidence for chord changes
            if confidence > self.confidence_threshold + 0.1:
                self.last_chord = best_chord
            else:
                # Keep previous chord
                best_chord = self.last_chord
        
        processing_time = (time.time() - start_time) * 1000
        
        # Update history
        self.chord_history.append({
            'chord': best_chord,
            'confidence': confidence,
            'processing_time': processing_time
        })
        
        return best_chord, confidence
    
    def get_performance_stats(self) -> Dict:
        """Get current performance statistics"""
        if not self.chord_history:
            return {}
        
        recent = list(self.chord_history)
        processing_times = [h['processing_time'] for h in recent]
        confidences = [h['confidence'] for h in recent if h['confidence'] > 0]
        
        return {
            'avg_processing_time': np.mean(processing_times),
            'avg_confidence': np.mean(confidences) if confidences else 0,
            'recent_chords': [h['chord'] for h in recent[-3:]],
            'total_processed': len(recent)
        }


# Global optimized detector instance
optimized_detector = OptimizedRealTimeChordDetector()
