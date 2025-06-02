#!/usr/bin/env python3
"""
Performance Optimization Suite for Real-Time Chord Detection

This script implements various optimizations to reduce latency and improve
accuracy of the real-time chord detection system.

Optimizations implemented:
1. Batch processing for multiple audio chunks
2. Caching of chord templates and computations
3. Optimized chroma feature extraction
4. Predictive chord modeling based on musical context
5. Adaptive confidence thresholds
6. Memory usage optimization
"""

import numpy as np
import librosa
import time
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import json
from collections import deque
import threading
import asyncio

@dataclass
class PerformanceMetrics:
    processing_time: float
    memory_usage: float
    confidence: float
    chord: str
    timestamp: float

class OptimizedChordDetector:
    def __init__(self):
        self.chord_history = deque(maxlen=10)  # Keep last 10 chords for context
        self.template_cache = {}
        self.chroma_cache = {}
        self.last_chord = "N"
        self.consecutive_count = 0
        self.confidence_threshold = 0.7
        
        # Pre-compute chord templates for faster lookup
        self._precompute_templates()
        
        # Musical context for chord prediction
        self.chord_progressions = {
            'C major': ['F major', 'G major', 'Am minor', 'Dm minor'],
            'G major': ['C major', 'D major', 'Em minor', 'Am minor'],
            'A major': ['D major', 'E major', 'F#m minor', 'Bm minor'],
            'E major': ['A major', 'B major', 'C#m minor', 'F#m minor'],
            'D major': ['G major', 'A major', 'Bm minor', 'Em minor'],
            'F major': ['Bb major', 'C major', 'Dm minor', 'Gm minor'],
        }
        
    def _precompute_templates(self):
        """Pre-compute all chord templates for faster matching"""
        
        # Basic chord templates based on circle of fifths
        chord_templates = {
            'C major': [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
            'C# major': [1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0],
            'D major': [0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
            'D# major': [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0],
            'E major': [0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
            'F major': [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0],
            'F# major': [0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1],
            'G major': [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
            'G# major': [1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0],
            'A major': [0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
            'A# major': [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0],
            'B major': [0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1],
            
            # Minor chords
            'Cm minor': [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
            'C#m minor': [1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0],
            'Dm minor': [0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
            'D#m minor': [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0],
            'Em minor': [0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1],
            'Fm minor': [1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0],
            'F#m minor': [0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1],
            'Gm minor': [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0],
            'G#m minor': [0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1],
            'Am minor': [1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
            'A#m minor': [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0],
            'Bm minor': [0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
        }
        
        # Convert to numpy arrays and normalize
        for chord, template in chord_templates.items():
            normalized = np.array(template, dtype=np.float32)
            normalized = normalized / np.sum(normalized) if np.sum(normalized) > 0 else normalized
            self.template_cache[chord] = normalized
    
    def _fast_chroma_extraction(self, audio: np.ndarray, sr: int) -> np.ndarray:
        """Optimized chroma feature extraction"""
        
        # Use cached parameters for speed
        cache_key = f"{len(audio)}_{sr}"
        if cache_key in self.chroma_cache:
            hop_length, n_fft = self.chroma_cache[cache_key]
        else:
            # Optimize parameters based on audio length
            hop_length = max(512, len(audio) // 20)  # At least 20 frames
            n_fft = min(2048, len(audio) // 2)  # Reasonable FFT size
            self.chroma_cache[cache_key] = (hop_length, n_fft)
        
        try:
            # Use faster CQT with reduced resolution for real-time processing
            chroma = librosa.feature.chroma_cqt(
                y=audio,
                sr=sr,
                hop_length=hop_length,
                n_chroma=12,
                bins_per_octave=12,  # Reduced from 24 for speed
                n_octaves=4,  # Reduced from 5 for speed
                fmin=librosa.note_to_hz('C2'),
                norm=2
            )
            
            # Average across time for real-time processing
            avg_chroma = np.mean(chroma, axis=1)
            
            # Normalize
            if np.sum(avg_chroma) > 0:
                avg_chroma = avg_chroma / np.sum(avg_chroma)
            
            return avg_chroma
            
        except Exception as e:
            print(f"Chroma extraction error: {e}")
            return np.zeros(12)
    
    def _predict_next_chord(self, current_chord: str) -> List[str]:
        """Predict likely next chords based on musical context"""
        if current_chord in self.chord_progressions:
            return self.chord_progressions[current_chord]
        return []
    
    def _adaptive_threshold(self) -> float:
        """Adjust confidence threshold based on recent performance"""
        if len(self.chord_history) < 3:
            return self.confidence_threshold
        
        # Lower threshold if we've had consistent high-confidence detections
        recent_confidences = [c.confidence for c in self.chord_history[-3:]]
        avg_confidence = np.mean(recent_confidences)
        
        if avg_confidence > 0.85:
            return max(0.6, self.confidence_threshold - 0.1)
        elif avg_confidence < 0.6:
            return min(0.8, self.confidence_threshold + 0.1)
        
        return self.confidence_threshold
    
    def detect_chord_optimized(self, audio: np.ndarray, sr: int) -> Tuple[str, float, PerformanceMetrics]:
        """Optimized chord detection with performance tracking"""
        start_time = time.time()
        
        # Fast chroma extraction
        chroma = self._fast_chroma_extraction(audio, sr)
        
        # Skip processing if very low energy
        if np.sum(chroma) < 0.05:
            processing_time = (time.time() - start_time) * 1000
            metrics = PerformanceMetrics(
                processing_time=processing_time,
                memory_usage=0.0,
                confidence=0.0,
                chord="N",
                timestamp=time.time()
            )
            return "N", 0.0, metrics
        
        # Get predicted chords for faster matching
        predicted_chords = self._predict_next_chord(self.last_chord) if self.last_chord != "N" else []
        
        best_chord = "N"
        best_correlation = 0.0
        
        # Check predicted chords first for speed
        for chord in predicted_chords:
            if chord in self.template_cache:
                template = self.template_cache[chord]
                correlation = np.corrcoef(chroma, template)[0, 1]
                if not np.isnan(correlation) and correlation > best_correlation:
                    best_correlation = correlation
                    best_chord = chord
        
        # If no good match in predictions, check all chords
        if best_correlation < 0.6:
            for chord, template in self.template_cache.items():
                correlation = np.corrcoef(chroma, template)[0, 1]
                if not np.isnan(correlation) and correlation > best_correlation:
                    best_correlation = correlation
                    best_chord = chord
        
        # Apply adaptive threshold
        threshold = self._adaptive_threshold()
        confidence = max(0.0, min(1.0, best_correlation))
        
        if confidence < threshold:
            best_chord = "N"
            confidence = 0.0
        
        # Temporal smoothing - require consistency for chord changes
        if best_chord != self.last_chord:
            if best_chord == "N" or confidence > threshold + 0.1:
                self.last_chord = best_chord
                self.consecutive_count = 1
            else:
                # Keep previous chord if new detection isn't confident enough
                best_chord = self.last_chord
        else:
            self.consecutive_count += 1
        
        processing_time = (time.time() - start_time) * 1000
        
        # Track metrics
        metrics = PerformanceMetrics(
            processing_time=processing_time,
            memory_usage=len(audio) * 4 / 1024,  # Rough memory estimate in KB
            confidence=confidence,
            chord=best_chord,
            timestamp=time.time()
        )
        
        # Update history
        self.chord_history.append(metrics)
        
        return best_chord, confidence, metrics


class BatchProcessor:
    """Process multiple audio chunks efficiently"""
    
    def __init__(self, detector: OptimizedChordDetector):
        self.detector = detector
        self.batch_size = 5
        
    def process_batch(self, audio_chunks: List[np.ndarray], sr: int) -> List[Tuple[str, float, PerformanceMetrics]]:
        """Process multiple audio chunks in batch for efficiency"""
        results = []
        
        start_time = time.time()
        
        for chunk in audio_chunks:
            chord, confidence, metrics = self.detector.detect_chord_optimized(chunk, sr)
            results.append((chord, confidence, metrics))
        
        batch_time = (time.time() - start_time) * 1000
        avg_time_per_chunk = batch_time / len(audio_chunks)
        
        print(f"Batch processed {len(audio_chunks)} chunks in {batch_time:.1f}ms (avg: {avg_time_per_chunk:.1f}ms per chunk)")
        
        return results


class PerformanceMonitor:
    """Monitor and report system performance"""
    
    def __init__(self):
        self.metrics_history = []
        self.performance_targets = {
            'latency_ms': 50,
            'confidence_min': 0.7,
            'throughput_fps': 20
        }
    
    def add_metrics(self, metrics: PerformanceMetrics):
        self.metrics_history.append(metrics)
        
        # Keep only recent metrics (last 100)
        if len(self.metrics_history) > 100:
            self.metrics_history = self.metrics_history[-100:]
    
    def get_performance_report(self) -> Dict:
        """Generate comprehensive performance report"""
        if not self.metrics_history:
            return {"error": "No metrics available"}
        
        processing_times = [m.processing_time for m in self.metrics_history]
        confidences = [m.confidence for m in self.metrics_history if m.confidence > 0]
        
        report = {
            'processing_time': {
                'avg': np.mean(processing_times),
                'median': np.median(processing_times),
                'p95': np.percentile(processing_times, 95),
                'target': self.performance_targets['latency_ms'],
                'meets_target': np.median(processing_times) < self.performance_targets['latency_ms']
            },
            'confidence': {
                'avg': np.mean(confidences) if confidences else 0,
                'min': np.min(confidences) if confidences else 0,
                'high_confidence_ratio': sum(1 for c in confidences if c > 0.7) / len(confidences) if confidences else 0
            },
            'throughput': {
                'chunks_per_second': len(processing_times) / max(1, (time.time() - self.metrics_history[0].timestamp)) if len(processing_times) > 1 else 0
            },
            'chord_detection': {
                'total_detections': len([m for m in self.metrics_history if m.chord != "N"]),
                'unique_chords': len(set(m.chord for m in self.metrics_history if m.chord != "N"))
            }
        }
        
        return report
    
    def print_live_stats(self):
        """Print live performance statistics"""
        if len(self.metrics_history) < 5:
            return
        
        recent = self.metrics_history[-5:]
        avg_time = np.mean([m.processing_time for m in recent])
        avg_conf = np.mean([m.confidence for m in recent if m.confidence > 0])
        
        print(f"\r🔥 Live Stats: {avg_time:.1f}ms avg | {avg_conf:.2f} confidence | "
              f"{recent[-1].chord} current", end="", flush=True)


def run_optimization_tests():
    """Run comprehensive optimization tests"""
    print("🚀 Starting Performance Optimization Tests")
    print("="*50)
    
    # Initialize components
    detector = OptimizedChordDetector()
    batch_processor = BatchProcessor(detector)
    monitor = PerformanceMonitor()
    
    # Load test audio
    print("📁 Loading test audio...")
    try:
        import librosa
        y, sr = librosa.load('/Users/stephanelkhoury/Documents/GitHub/harmonix/samples/test_audio.mp3', sr=44100)
        print(f"✅ Loaded {len(y)/sr:.2f}s of audio at {sr}Hz")
    except Exception as e:
        print(f"❌ Failed to load audio: {e}")
        return
    
    # Create chunks for testing
    chunk_duration = 0.5  # 500ms chunks
    chunk_size = int(sr * chunk_duration)
    chunks = []
    
    for i in range(0, min(len(y), chunk_size * 20), chunk_size):  # Test 20 chunks max
        chunk = y[i:i + chunk_size]
        if len(chunk) == chunk_size:
            chunks.append(chunk)
    
    print(f"📊 Created {len(chunks)} test chunks")
    
    # Test 1: Single chunk processing speed
    print("\n🧪 Test 1: Single Chunk Processing Speed")
    single_times = []
    for i, chunk in enumerate(chunks[:10]):
        start = time.time()
        chord, confidence, metrics = detector.detect_chord_optimized(chunk, sr)
        end = time.time()
        
        processing_time = (end - start) * 1000
        single_times.append(processing_time)
        monitor.add_metrics(metrics)
        
        print(f"  Chunk {i+1}: {chord} ({confidence:.2f}) - {processing_time:.1f}ms")
    
    avg_single = np.mean(single_times)
    print(f"  Average single chunk: {avg_single:.1f}ms")
    
    # Test 2: Batch processing
    print("\n🧪 Test 2: Batch Processing")
    batch_chunks = chunks[10:15]  # Process 5 chunks in batch
    batch_results = batch_processor.process_batch(batch_chunks, sr)
    
    for i, (chord, confidence, metrics) in enumerate(batch_results):
        monitor.add_metrics(metrics)
        print(f"  Batch chunk {i+1}: {chord} ({confidence:.2f}) - {metrics.processing_time:.1f}ms")
    
    # Test 3: Live simulation
    print("\n🧪 Test 3: Live Processing Simulation")
    print("Processing chunks in real-time...")
    
    for i, chunk in enumerate(chunks[15:25]):  # Process 10 more chunks
        chord, confidence, metrics = detector.detect_chord_optimized(chunk, sr)
        monitor.add_metrics(metrics)
        monitor.print_live_stats()
        
        # Simulate real-time processing (500ms intervals)
        time.sleep(0.1)  # Reduced sleep for demo
    
    print("\n")  # New line after live stats
    
    # Generate final report
    print("\n📊 OPTIMIZATION PERFORMANCE REPORT")
    print("="*50)
    report = monitor.get_performance_report()
    
    print(f"⚡ PROCESSING TIME:")
    print(f"  Average: {report['processing_time']['avg']:.1f}ms")
    print(f"  Median: {report['processing_time']['median']:.1f}ms")
    print(f"  95th %: {report['processing_time']['p95']:.1f}ms")
    print(f"  Target: {report['processing_time']['target']}ms")
    print(f"  Meets Target: {'✅' if report['processing_time']['meets_target'] else '❌'}")
    
    print(f"\n🎯 ACCURACY:")
    print(f"  Average Confidence: {report['confidence']['avg']:.2f}")
    print(f"  High Confidence Ratio: {report['confidence']['high_confidence_ratio']:.1%}")
    
    print(f"\n🏎️ THROUGHPUT:")
    print(f"  Chunks/second: {report['throughput']['chunks_per_second']:.1f}")
    
    print(f"\n🎵 DETECTION:")
    print(f"  Total Detections: {report['chord_detection']['total_detections']}")
    print(f"  Unique Chords: {report['chord_detection']['unique_chords']}")
    
    # Performance grade
    grade = "A"
    if report['processing_time']['median'] > 75 or report['confidence']['avg'] < 0.6:
        grade = "B"
    if report['processing_time']['median'] > 100 or report['confidence']['avg'] < 0.4:
        grade = "C"
    
    print(f"\n🏆 OPTIMIZATION GRADE: {grade}")
    
    # Recommendations
    print(f"\n💡 OPTIMIZATION RECOMMENDATIONS:")
    if report['processing_time']['median'] > 50:
        print("  - Consider reducing chroma resolution for real-time processing")
    if report['confidence']['avg'] < 0.7:
        print("  - Tune chord templates for better accuracy")
    if report['chord_detection']['unique_chords'] < 5:
        print("  - Test with more diverse musical content")
    
    print("\n✅ Optimization tests completed!")


if __name__ == "__main__":
    run_optimization_tests()
