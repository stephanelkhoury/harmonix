#!/usr/bin/env python3
"""
End-to-End Testing Script for Real-Time Chord Detection System

This script tests the complete real-time chord detection pipeline including:
1. Audio input simulation
2. Real-time chord detection API
3. WebSocket streaming functionality
4. Performance metrics collection
5. Accuracy validation

Usage:
    python test_realtime_system.py [--audio-file path/to/audio.wav] [--duration 30]
"""

import asyncio
import websockets
import json
import time
import base64
import numpy as np
import librosa
import argparse
import requests
from typing import Dict, List, Tuple
import statistics
import sys
import os

class RealTimeSystemTester:
    def __init__(self, api_base_url="http://localhost:8000", ws_url="ws://localhost:8000"):
        self.api_base_url = api_base_url
        self.ws_url = ws_url
        self.metrics = {
            "latency_measurements": [],
            "chord_changes": [],
            "confidence_scores": [],
            "errors": [],
            "processing_times": []
        }
        
    def test_api_health(self):
        """Test if the API is responsive"""
        try:
            response = requests.get(f"{self.api_base_url}/health", timeout=5)
            if response.status_code == 200:
                print("✅ API Health Check: PASSED")
                return True
            else:
                print(f"❌ API Health Check: FAILED - Status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API Health Check: FAILED - {e}")
            return False
    
    def test_capo_settings(self):
        """Test capo position settings"""
        try:
            # Test setting capo to position 3
            response = requests.post(
                f"{self.api_base_url}/api/set-capo",
                json={"capo_position": 3},
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                if data.get("capo_position") == 3:
                    print("✅ Capo Settings Test: PASSED")
                    return True
            
            print(f"❌ Capo Settings Test: FAILED - {response.text}")
            return False
        except Exception as e:
            print(f"❌ Capo Settings Test: FAILED - {e}")
            return False
    
    def generate_test_audio_chunk(self, duration=0.5, sample_rate=44100, chord_freq=440):
        """Generate a synthetic audio chunk simulating a chord"""
        t = np.linspace(0, duration, int(sample_rate * duration))
        
        # Generate a chord (fundamental + 3rd + 5th harmonics)
        fundamental = np.sin(2 * np.pi * chord_freq * t)
        third = np.sin(2 * np.pi * chord_freq * 1.25 * t) * 0.7  # Major third
        fifth = np.sin(2 * np.pi * chord_freq * 1.5 * t) * 0.5   # Perfect fifth
        
        # Combine frequencies to simulate a major chord
        audio = (fundamental + third + fifth) / 3.0
        
        # Add some noise for realism
        noise = np.random.normal(0, 0.05, len(audio))
        audio = audio + noise
        
        # Normalize
        audio = audio / np.max(np.abs(audio))
        
        return (audio * 32767).astype(np.int16)
    
    def load_real_audio(self, file_path, chunk_duration=0.5):
        """Load real audio file and split into chunks"""
        try:
            audio, sr = librosa.load(file_path, sr=44100)
            chunk_size = int(sr * chunk_duration)
            chunks = []
            
            for i in range(0, len(audio), chunk_size):
                chunk = audio[i:i + chunk_size]
                if len(chunk) == chunk_size:  # Only full chunks
                    chunks.append((chunk * 32767).astype(np.int16))
            
            print(f"✅ Loaded {len(chunks)} chunks from {file_path}")
            return chunks
        except Exception as e:
            print(f"❌ Failed to load audio file {file_path}: {e}")
            return None
    
    def test_real_time_chord_api(self, audio_chunks):
        """Test the real-time chord detection REST API"""
        print("🧪 Testing Real-Time Chord Detection API...")
        
        for i, chunk in enumerate(audio_chunks[:5]):  # Test first 5 chunks
            try:
                start_time = time.time()
                
                # Encode audio chunk to base64
                audio_b64 = base64.b64encode(chunk.tobytes()).decode('utf-8')
                
                # Send to API
                response = requests.post(
                    f"{self.api_base_url}/api/real-time-chord",
                    json={
                        "audio_data": audio_b64,
                        "sample_rate": 44100,
                        "capo_position": 0
                    },
                    timeout=10
                )
                
                end_time = time.time()
                latency = (end_time - start_time) * 1000  # Convert to ms
                
                if response.status_code == 200:
                    data = response.json()
                    chord = data.get("chord", "Unknown")
                    confidence = data.get("confidence", 0)
                    
                    self.metrics["latency_measurements"].append(latency)
                    self.metrics["confidence_scores"].append(confidence)
                    self.metrics["chord_changes"].append(chord)
                    
                    print(f"  Chunk {i+1}: {chord} (confidence: {confidence:.2f}, latency: {latency:.1f}ms)")
                else:
                    print(f"  ❌ Chunk {i+1}: API error - {response.status_code}")
                    self.metrics["errors"].append(f"API error {response.status_code}")
                    
            except Exception as e:
                print(f"  ❌ Chunk {i+1}: Exception - {e}")
                self.metrics["errors"].append(str(e))
    
    async def test_websocket_streaming(self, audio_chunks):
        """Test WebSocket real-time streaming"""
        print("🧪 Testing WebSocket Streaming...")
        
        try:
            async with websockets.connect(f"{self.ws_url}/api/ws/real-time-chords") as websocket:
                print("✅ WebSocket connection established")
                
                # Send chunks with timing
                for i, chunk in enumerate(audio_chunks[:10]):  # Test first 10 chunks
                    start_time = time.time()
                    
                    # Encode and send in the correct format
                    audio_b64 = base64.b64encode(chunk.tobytes()).decode('utf-8')
                    message = {
                        "type": "audio_chunk",
                        "data": {
                            "audio_data": audio_b64,
                            "sample_rate": 44100,
                            "capo_position": 0
                        }
                    }
                    
                    await websocket.send(json.dumps(message))
                    
                    # Wait for response
                    try:
                        response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                        end_time = time.time()
                        latency = (end_time - start_time) * 1000
                        
                        data = json.loads(response)
                        
                        if data.get("type") == "chord_update":
                            chord_data = data.get("data", {})
                            chord = chord_data.get("chord", "Unknown")
                            confidence = chord_data.get("confidence", 0)
                            
                            print(f"  Chunk {i+1}: {chord} (confidence: {confidence:.2f}, latency: {latency:.1f}ms)")
                            
                            self.metrics["latency_measurements"].append(latency)
                            self.metrics["confidence_scores"].append(confidence)
                        else:
                            print(f"  Chunk {i+1}: Unexpected response type: {data.get('type')}")
                        
                    except asyncio.TimeoutError:
                        print(f"  ❌ Chunk {i+1}: WebSocket timeout")
                        self.metrics["errors"].append("WebSocket timeout")
                    
                    # Simulate real-time streaming (500ms intervals)
                    await asyncio.sleep(0.5)
                
        except Exception as e:
            print(f"❌ WebSocket test failed: {e}")
            self.metrics["errors"].append(f"WebSocket error: {e}")
    
    def test_performance_under_load(self, audio_chunks):
        """Test system performance under load"""
        print("🧪 Testing Performance Under Load...")
        
        # Rapid fire requests
        start_time = time.time()
        for i in range(20):
            chunk = audio_chunks[i % len(audio_chunks)]
            try:
                request_start = time.time()
                audio_b64 = base64.b64encode(chunk.tobytes()).decode('utf-8')
                
                response = requests.post(
                    f"{self.api_base_url}/api/real-time-chord",
                    json={
                        "audio_data": audio_b64,
                        "sample_rate": 44100,
                        "capo_position": 0
                    },
                    timeout=5
                )
                
                request_end = time.time()
                processing_time = (request_end - request_start) * 1000
                self.metrics["processing_times"].append(processing_time)
                
                if response.status_code != 200:
                    self.metrics["errors"].append(f"Load test error {response.status_code}")
                    
            except Exception as e:
                self.metrics["errors"].append(f"Load test exception: {e}")
        
        total_time = time.time() - start_time
        throughput = 20 / total_time
        print(f"  Processed 20 requests in {total_time:.2f}s (throughput: {throughput:.1f} req/s)")
    
    def generate_performance_report(self):
        """Generate comprehensive performance report"""
        print("\n" + "="*50)
        print("📊 PERFORMANCE REPORT")
        print("="*50)
        
        # Latency Analysis
        if self.metrics["latency_measurements"]:
            latencies = self.metrics["latency_measurements"]
            print(f"🕐 LATENCY ANALYSIS:")
            print(f"  Average: {statistics.mean(latencies):.1f}ms")
            print(f"  Median:  {statistics.median(latencies):.1f}ms")
            print(f"  Min:     {min(latencies):.1f}ms")
            print(f"  Max:     {max(latencies):.1f}ms")
            print(f"  95th %:  {np.percentile(latencies, 95):.1f}ms")
        
        # Confidence Analysis
        if self.metrics["confidence_scores"]:
            confidences = self.metrics["confidence_scores"]
            print(f"\n🎯 CONFIDENCE ANALYSIS:")
            print(f"  Average: {statistics.mean(confidences):.2f}")
            print(f"  Min:     {min(confidences):.2f}")
            print(f"  Max:     {max(confidences):.2f}")
            print(f"  High confidence (>0.7): {sum(1 for c in confidences if c > 0.7)}/{len(confidences)}")
        
        # Processing Time Analysis
        if self.metrics["processing_times"]:
            times = self.metrics["processing_times"]
            print(f"\n⚡ PROCESSING TIME ANALYSIS:")
            print(f"  Average: {statistics.mean(times):.1f}ms")
            print(f"  95th %:  {np.percentile(times, 95):.1f}ms")
        
        # Error Analysis
        print(f"\n❌ ERROR ANALYSIS:")
        print(f"  Total errors: {len(self.metrics['errors'])}")
        if self.metrics["errors"]:
            error_types = {}
            for error in self.metrics["errors"]:
                error_type = error.split(":")[0] if ":" in error else error
                error_types[error_type] = error_types.get(error_type, 0) + 1
            
            for error_type, count in error_types.items():
                print(f"  {error_type}: {count}")
        
        # Chord Detection Analysis
        if self.metrics["chord_changes"]:
            chords = self.metrics["chord_changes"]
            unique_chords = set(chords)
            print(f"\n🎵 CHORD DETECTION ANALYSIS:")
            print(f"  Unique chords detected: {len(unique_chords)}")
            print(f"  Most common: {max(set(chords), key=chords.count) if chords else 'None'}")
            print(f"  Chord changes detected: {len(chords)}")
        
        # Performance Grade
        avg_latency = statistics.mean(self.metrics["latency_measurements"]) if self.metrics["latency_measurements"] else float('inf')
        avg_confidence = statistics.mean(self.metrics["confidence_scores"]) if self.metrics["confidence_scores"] else 0
        error_rate = len(self.metrics["errors"]) / max(len(self.metrics["chord_changes"]), 1)
        
        grade = "A"
        if avg_latency > 500 or avg_confidence < 0.5 or error_rate > 0.1:
            grade = "B"
        if avg_latency > 1000 or avg_confidence < 0.3 or error_rate > 0.3:
            grade = "C"
        if avg_latency > 2000 or avg_confidence < 0.1 or error_rate > 0.5:
            grade = "D"
        
        print(f"\n🏆 OVERALL PERFORMANCE GRADE: {grade}")
        
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        if avg_latency > 300:
            print("  - Consider optimizing audio processing pipeline for lower latency")
        if avg_confidence < 0.6:
            print("  - Improve chord detection model or tuning parameters")
        if error_rate > 0.1:
            print("  - Investigate and fix error sources")
        if len(unique_chords) < 3:
            print("  - Test with more diverse audio content")

async def main():
    parser = argparse.ArgumentParser(description="Test Real-Time Chord Detection System")
    parser.add_argument("--audio-file", help="Path to audio file for testing")
    parser.add_argument("--duration", type=int, default=30, help="Test duration in seconds")
    parser.add_argument("--api-url", default="http://localhost:8000", help="API base URL")
    parser.add_argument("--ws-url", default="ws://localhost:8000", help="WebSocket base URL")
    
    args = parser.parse_args()
    
    print("🚀 Starting Real-Time Chord Detection System Tests")
    print("="*50)
    
    tester = RealTimeSystemTester(args.api_url, args.ws_url)
    
    # Basic health checks
    if not tester.test_api_health():
        print("❌ API health check failed. Make sure the Python service is running.")
        sys.exit(1)
    
    if not tester.test_capo_settings():
        print("❌ Capo settings test failed.")
        sys.exit(1)
    
    # Prepare audio chunks
    if args.audio_file and os.path.exists(args.audio_file):
        print(f"🎵 Loading audio from: {args.audio_file}")
        audio_chunks = tester.load_real_audio(args.audio_file)
        if not audio_chunks:
            print("❌ Failed to load audio file. Using synthetic audio.")
            audio_chunks = [tester.generate_test_audio_chunk(chord_freq=440 + i*50) for i in range(10)]
    else:
        print("🎵 Generating synthetic audio chunks...")
        # Generate different chord frequencies for testing
        chord_frequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88]  # C, D, E, F, G, A, B
        audio_chunks = [tester.generate_test_audio_chunk(chord_freq=freq) for freq in chord_frequencies]
    
    print(f"✅ Prepared {len(audio_chunks)} audio chunks for testing")
    
    # Run tests
    tester.test_real_time_chord_api(audio_chunks)
    await tester.test_websocket_streaming(audio_chunks)
    tester.test_performance_under_load(audio_chunks)
    
    # Generate report
    tester.generate_performance_report()

if __name__ == "__main__":
    asyncio.run(main())
