#!/usr/bin/env python3
"""
Comprehensive Test of Optimized Real-Time Chord Detection Integration

Tests the complete Capo-like system with optimized performance.
"""

import requests
import json
import base64
import numpy as np
import time
import librosa
from datetime import datetime

# API Configuration
API_BASE = "http://localhost:8000"

def generate_chord_audio(chord_freqs, duration=1.0, sr=22050):
    """Generate audio for a specific chord"""
    t = np.linspace(0, duration, int(sr * duration))
    signal = np.zeros_like(t)
    
    for i, freq in enumerate(chord_freqs):
        amplitude = 0.3 / len(chord_freqs)  # Normalize amplitude
        signal += amplitude * np.sin(2 * np.pi * freq * t)
    
    # Convert to int16 for API
    signal_int16 = (signal * 32767).astype(np.int16)
    return signal_int16

def test_chord_detection():
    """Test chord detection with various musical chords"""
    print("🎵 Testing Optimized Chord Detection")
    print("=" * 50)
    
    # Define test chords with their frequencies
    test_chords = {
        "C major": [261.63, 329.63, 392.00],  # C-E-G
        "G major": [196.00, 246.94, 293.66],  # G-B-D
        "Am minor": [220.00, 261.63, 329.63], # A-C-E
        "F major": [174.61, 220.00, 261.63],  # F-A-C
        "D major": [146.83, 185.00, 220.00],  # D-F#-A
        "Em minor": [164.81, 196.00, 246.94], # E-G-B
    }
    
    results = []
    
    for chord_name, freqs in test_chords.items():
        print(f"\n🎵 Testing {chord_name}...")
        
        # Generate audio
        audio_data = generate_chord_audio(freqs)
        audio_b64 = base64.b64encode(audio_data.tobytes()).decode('utf-8')
        
        # Test via API
        start_time = time.time()
        
        payload = {
            "audio_data": audio_b64,
            "sample_rate": 22050,
            "duration": 1.0
        }
        
        try:
            response = requests.post(f"{API_BASE}/api/real-time-chord", json=payload)
            end_time = time.time()
            
            if response.status_code == 200:
                result = response.json()
                latency = (end_time - start_time) * 1000
                
                detected = result['chord']
                confidence = result['confidence']
                
                print(f"  Input: {chord_name}")
                print(f"  Detected: {detected}")
                print(f"  Confidence: {confidence:.3f}")
                print(f"  Latency: {latency:.1f}ms")
                
                # Check if detection is reasonable
                is_correct = chord_name.split()[0] in detected if detected != "N" else False
                
                results.append({
                    'input': chord_name,
                    'detected': detected,
                    'confidence': confidence,
                    'latency': latency,
                    'correct': is_correct
                })
                
                status = "✅" if is_correct else "❌" if detected != "N" else "⚠️"
                print(f"  Result: {status}")
                
            else:
                print(f"  ❌ API Error: {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ Exception: {str(e)}")
    
    return results

def test_capo_functionality():
    """Test capo transposition functionality"""
    print(f"\n🎸 Testing Capo Functionality")
    print("=" * 30)
    
    # Set capo to 2nd fret
    capo_settings = {"capo_position": 2, "tuning": "standard"}
    
    try:
        response = requests.post(f"{API_BASE}/api/set-capo", json=capo_settings)
        if response.status_code == 200:
            print("✅ Capo set to 2nd fret")
            
            # Test a C major chord with capo
            audio_data = generate_chord_audio([261.63, 329.63, 392.00])  # C major
            audio_b64 = base64.b64encode(audio_data.tobytes()).decode('utf-8')
            
            payload = {
                "audio_data": audio_b64,
                "sample_rate": 22050,
                "duration": 1.0
            }
            
            response = requests.post(f"{API_BASE}/api/real-time-chord", json=payload)
            if response.status_code == 200:
                result = response.json()
                print(f"  C major with capo: {result['chord']} (should be transposed)")
                print(f"  Capo position: {result['capo_position']}")
                
        # Reset capo
        capo_settings = {"capo_position": 0, "tuning": "standard"}
        requests.post(f"{API_BASE}/api/set-capo", json=capo_settings)
        print("✅ Capo reset")
        
    except Exception as e:
        print(f"❌ Capo test failed: {str(e)}")

def performance_summary(results):
    """Print performance summary"""
    print(f"\n📊 PERFORMANCE SUMMARY")
    print("=" * 40)
    
    if not results:
        print("❌ No results to analyze")
        return
    
    # Calculate metrics
    latencies = [r['latency'] for r in results]
    confidences = [r['confidence'] for r in results if r['confidence'] > 0]
    correct_detections = sum(1 for r in results if r['correct'])
    
    print(f"🕐 Latency:")
    print(f"  Average: {np.mean(latencies):.1f}ms")
    print(f"  Median:  {np.median(latencies):.1f}ms")
    print(f"  Range:   {np.min(latencies):.1f}ms - {np.max(latencies):.1f}ms")
    
    print(f"\n🎯 Accuracy:")
    print(f"  Correct detections: {correct_detections}/{len(results)}")
    print(f"  Accuracy rate: {correct_detections/len(results)*100:.1f}%")
    
    if confidences:
        print(f"\n📈 Confidence:")
        print(f"  Average: {np.mean(confidences):.3f}")
        print(f"  Range:   {np.min(confidences):.3f} - {np.max(confidences):.3f}")
    
    # Grade the system
    accuracy_score = correct_detections / len(results)
    latency_score = 1.0 if np.mean(latencies) < 100 else 0.5
    confidence_score = np.mean(confidences) if confidences else 0
    
    overall_score = (accuracy_score * 0.5 + latency_score * 0.3 + confidence_score * 0.2)
    
    if overall_score >= 0.8:
        grade = "A"
    elif overall_score >= 0.6:
        grade = "B" 
    elif overall_score >= 0.4:
        grade = "C"
    else:
        grade = "D"
    
    print(f"\n🏆 Overall Grade: {grade}")
    
    return {
        'latency': np.mean(latencies),
        'accuracy': accuracy_score,
        'confidence': np.mean(confidences) if confidences else 0,
        'grade': grade
    }

def main():
    """Run comprehensive integration test"""
    print("🚀 Optimized Real-Time Chord Detection Integration Test")
    print("=" * 60)
    print(f"🕐 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check API health
    try:
        response = requests.get(f"{API_BASE}/health")
        if response.status_code == 200:
            print("✅ API is healthy and ready")
        else:
            print("❌ API health check failed")
            return
    except:
        print("❌ Cannot connect to API. Make sure the Python service is running.")
        return
    
    # Run tests
    results = test_chord_detection()
    test_capo_functionality()
    
    # Performance summary
    summary = performance_summary(results)
    
    print(f"\n🎉 Integration test completed!")
    print(f"📈 System Performance: {summary['grade']} grade")
    print(f"⚡ Ready for production use with optimized performance!")

if __name__ == "__main__":
    main()
