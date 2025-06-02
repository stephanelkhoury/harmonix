import os
import tempfile
from fastapi import FastAPI, File, UploadFile, Request, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
import uvicorn
import librosa
import numpy as np
import subprocess
import json
import datetime
import requests
from langdetect import detect
import re
import yt_dlp
import speech_recognition as sr
from music_intelligence import MusicIntelligenceEngine
from enhanced_chord_detection import EnhancedChordDetector, ImprovedTonalFragment, ChordProgressionAnalyzer
from improved_chord_detection import ImprovedChordDetector
from optimized_realtime_detection import OptimizedRealTimeChordDetector

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Music Intelligence Engine and Enhanced Chord Detector
music_intelligence = MusicIntelligenceEngine()
enhanced_chord_detector = EnhancedChordDetector()
improved_chord_detector = ImprovedChordDetector()  # New improved detector
optimized_realtime_detector = OptimizedRealTimeChordDetector()  # Optimized for real-time
progression_analyzer = ChordProgressionAnalyzer()

def extract_youtube_id(url):
    """Extract YouTube video ID from various URL formats"""
    import re
    
    if not url:
        return None
        
    url = url.strip()
    
    # YouTube URL patterns
    patterns = [
        r'(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})',
        r'(?:youtube\.com\/|youtu\.be\/)([^"&?\/\s]{11})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url, re.IGNORECASE)
        if match:
            return match.group(1)
    
    # Fallback: if the input is exactly 11 characters, it might be a direct video ID
    if len(url) == 11:
        return url
    
    return None

# Tonal_Fragment class for chord analysis
class Tonal_Fragment(object):
    def __init__(self, waveform, sr, tstart=None, tend=None):
        self.waveform = waveform
        self.sr = sr
        self.tstart = tstart
        self.tend = tend
        if self.tstart is not None:
            self.tstart = librosa.time_to_samples(self.tstart, sr=self.sr)
        if self.tend is not None:
            self.tend = librosa.time_to_samples(self.tend, sr=self.sr)
        self.y_segment = self.waveform[self.tstart:self.tend]
        self.chromograph = librosa.feature.chroma_cqt(y=self.y_segment, sr=self.sr, bins_per_octave=24)
        self.chroma_vals = []
        for i in range(12):
            self.chroma_vals.append(np.sum(self.chromograph[i]))
        pitches = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
        self.keyfreqs = {pitches[i]: self.chroma_vals[i] for i in range(12)}
        keys = [pitches[i] + ' major' for i in range(12)] + [pitches[i] + ' minor' for i in range(12)]
        maj_profile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
        min_profile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
        self.min_key_corrs = []
        self.maj_key_corrs = []
        for i in range(12):
            key_test = [self.keyfreqs.get(pitches[(i + m)%12]) for m in range(12)]
            self.maj_key_corrs.append(round(float(np.corrcoef(maj_profile, key_test)[1,0]), 3))
            self.min_key_corrs.append(round(float(np.corrcoef(min_profile, key_test)[1,0]), 3))
        self.key_dict = {**{keys[i]: self.maj_key_corrs[i] for i in range(12)},
                         **{keys[i+12]: self.min_key_corrs[i] for i in range(12)}}
        self.key = max(self.key_dict, key=self.key_dict.get)
        self.bestcorr = max(self.key_dict.values())
        self.altkey = None
        self.altbestcorr = None
        for key, corr in self.key_dict.items():
            if corr > self.bestcorr*0.9 and corr != self.bestcorr:
                self.altkey = key
                self.altbestcorr = corr

def download_youtube_audio(youtube_url: str) -> str:
    """Download audio from YouTube URL and return path to the downloaded file"""
    temp_dir = None
    try:
        temp_dir = tempfile.mkdtemp()
        output_template = os.path.join(temp_dir, "%(id)s.%(ext)s")
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'wav',
                'preferredquality': '192',
            }],
            'outtmpl': output_template,
            'quiet': True,
            'no_warnings': True,
            'extract_audio': True,
            'audioformat': 'wav',
            'socket_timeout': 60,  # 60 second timeout for socket operations
            'retries': 3,          # Retry up to 3 times
            'fragment_retries': 3, # Retry fragments up to 3 times
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(youtube_url, download=True)
                if not info:
                    raise ValueError("Could not extract video information")
                
                # Find the downloaded file
                files = os.listdir(temp_dir)
                if not files:
                    raise FileNotFoundError("No audio file was downloaded")
                
                # Return the full path to the first file (should be our audio)
                downloaded_file = os.path.join(temp_dir, files[0])
                if not os.path.exists(downloaded_file):
                    raise FileNotFoundError(f"Downloaded file not found at {downloaded_file}")
                
                return downloaded_file
            
            except yt_dlp.utils.DownloadError as e:
                print(f"YouTube download error: {str(e)}")
                raise ValueError(f"Failed to download video: {str(e)}")
            except Exception as e:
                print(f"Error during download: {str(e)}")
                raise
    except Exception as e:
        if temp_dir and os.path.exists(temp_dir):
            try:
                import shutil
                shutil.rmtree(temp_dir)
            except:
                pass
        raise ValueError(f"Error downloading YouTube audio: {str(e)}")

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "python_service"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """Analyze uploaded audio file for chords"""
    print(f"Received file: {file.filename}")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
        try:
            content = await file.read()
            print(f"File size: {len(content)} bytes")
            tmp.write(content)
            tmp_path = tmp.name
        except Exception as e:
            print(f"Error reading uploaded file: {str(e)}")
            return {"error": f"Failed to process upload: {str(e)}"}
    
    try:
        print(f"Starting enhanced analysis of file: {file.filename}")
        y, sr = librosa.load(tmp_path)
        y_harmonic, _ = librosa.effects.hpss(y)
        duration = librosa.get_duration(y=y, sr=sr)
        
        # Enhanced key detection
        print("Detecting key with improved algorithm...")
        key, key_confidence = improved_chord_detector.detect_key_improved(y_harmonic, sr)
        print(f"Detected key: {key} (confidence: {key_confidence:.3f})")
        
        # Detect tempo
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        
        # Enhanced chord detection with improved method
        print("Running improved chord detection...")
        
        # Use the improved detector to fix major/minor conflicts
        improved_chords = improved_chord_detector.detect_chords_improved(y_harmonic, sr)
        
        # Fallback to enhanced method if improved fails
        if len(improved_chords) == 0:
            print("Falling back to enhanced detection...")
            improved_chords = enhanced_chord_detector.detect_chords_enhanced(y_harmonic, sr)
        
        # Use improved detection as primary method
        chords = improved_chords
        # Ensure all chords have confidence scores
        for chord in chords:
            if 'confidence' not in chord:
                chord['confidence'] = 0.5  # Default confidence
        
        print(f"Detected {len(chords)} chord segments")
        
        # Apply progression analysis for error correction
        print("Applying progression analysis and error correction...")
        chords = progression_analyzer.analyze_and_correct_progression(chords, key)
        print("Progression analysis complete")
        
        # Apply Music Intelligence Analysis
        print("Applying intelligent music analysis...")
        try:
            progression_analysis = music_intelligence.analyze_progression_intelligence(chords, key)
            structural_analysis = music_intelligence.analyze_song_structure(chords, duration)
            practice_suggestions = music_intelligence.generate_practice_suggestions(chords, key, tempo)
            
            intelligence_data = {
                "progression_analysis": {
                    "function_analysis": progression_analysis.function_analysis,
                    "key_modulations": progression_analysis.key_modulations,
                    "common_patterns": progression_analysis.common_patterns,
                    "complexity_score": progression_analysis.complexity_score,
                    "suggested_substitutions": progression_analysis.suggested_substitutions,
                    "mood_indicators": progression_analysis.mood_indicators
                },
                "structural_analysis": {
                    "sections": structural_analysis.sections,
                    "repetition_score": structural_analysis.repetition_score,
                    "development_arc": structural_analysis.development_arc,
                    "climax_points": structural_analysis.climax_points
                },
                "practice_suggestions": practice_suggestions
            }
        except Exception as e:
            print(f"Intelligence analysis failed: {e}")
            intelligence_data = {"error": f"Intelligence analysis failed: {str(e)}"}
        
        # Create result object
        result = {
            "chords": chords,
            "key": key,
            "tempo": round(tempo, 2),
            "duration": round(duration, 2),
            "filename": file.filename,
            "timestamp": str(datetime.datetime.now()),
            "intelligence": intelligence_data
        }
        
        # Save analysis results
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename_safe = ''.join(c if c.isalnum() else '_' for c in file.filename)
        json_filename = f"{timestamp}_{filename_safe}.json"
        
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        song_chords_dir = os.path.join(project_root, "SongChords")
        os.makedirs(song_chords_dir, exist_ok=True)
        
        json_path = os.path.join(song_chords_dir, json_filename)
        with open(json_path, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"Saved chord analysis to {json_path}")
        
        return result
    except Exception as e:
        print(f"Error analyzing audio: {str(e)}")
        return {"error": f"Failed to analyze audio: {str(e)}"}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.post("/analyze-youtube")
async def analyze_youtube(request: Request):
    """Analyze YouTube video audio for chords"""
    try:
        data = await request.json()
        url = data.get("url")
        if not url:
            return {"error": "No YouTube URL provided"}
        
        print(f"Attempting to analyze YouTube audio from: {url}")
        
        # Extract and validate YouTube ID first
        video_id = extract_youtube_id(url)
        if not video_id:
            return {"error": "Invalid YouTube URL format"}
        
        print(f"Extracted video ID: {video_id}")
        
        try:
            # Download the audio file with timeout handling
            print("Starting YouTube audio download...")
            audio_path = download_youtube_audio(url)
            if not os.path.exists(audio_path):
                return {"error": "Failed to download audio from YouTube"}
            
            print(f"Successfully downloaded audio to: {audio_path}")
            
            # Analyze the audio with enhanced detection
            print("Starting enhanced audio analysis...")
            y, sr = librosa.load(audio_path)
            y_harmonic, _ = librosa.effects.hpss(y)
            duration = float(librosa.get_duration(y=y, sr=sr))  # Convert to Python float
            
            print(f"Audio loaded successfully. Duration: {duration:.2f} seconds")
            
            # Enhanced key detection
            print("Detecting key with enhanced algorithm...")
            key, key_confidence = enhanced_chord_detector.detect_key_enhanced(y_harmonic, sr)
            print(f"Detected key: {key} (confidence: {key_confidence:.3f})")
            
            # Detect tempo
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            tempo = float(tempo[0]) if hasattr(tempo, '__len__') and len(tempo) > 0 else float(tempo)  # Handle array or scalar
            
            print(f"Detected tempo: {tempo:.2f}")
            
            # Enhanced chord detection
            print("Running enhanced chord detection...")
            
            # Method 1: Enhanced continuous detection
            enhanced_chords = enhanced_chord_detector.detect_chords_enhanced(y_harmonic, sr)
            
            # Method 2: Improved segmented detection for comparison
            print("Running segmented chord analysis...")
            bin_size = 1
            segmented_chords = []
            chord_count = int(duration)//bin_size
            
            for i in range(0, chord_count):
                tstart = bin_size * i
                tend = bin_size * (i+1)
                fragment = ImprovedTonalFragment(
                    y_harmonic, sr, 
                    tstart=tstart, tend=tend, 
                    enhanced_detector=enhanced_chord_detector
                )
                segmented_chords.append({
                    "time": tstart,
                    "chord": fragment.key,
                    "confidence": getattr(fragment, 'confidence', 0.0)
                })
            
            # Use enhanced method if available, fallback to segmented
            chords = enhanced_chords if len(enhanced_chords) > 0 else segmented_chords
            
            # Add confidence scores if using segmented method
            if chords == segmented_chords:
                for chord in chords:
                    if 'confidence' not in chord:
                        chord['confidence'] = 0.5
            
            print(f"Analysis complete. Found {len(chords)} chord segments.")
            
            # Apply progression analysis for error correction
            print("Applying progression analysis and error correction...")
            chords = progression_analyzer.analyze_and_correct_progression(chords, key)
            print("Progression analysis complete")
            
            # Apply Music Intelligence Analysis
            print("Applying intelligent music analysis...")
            try:
                progression_analysis = music_intelligence.analyze_progression_intelligence(chords, key)
                structural_analysis = music_intelligence.analyze_song_structure(chords, duration)
                practice_suggestions = music_intelligence.generate_practice_suggestions(chords, key, tempo)
                
                intelligence_data = {
                    "progression_analysis": {
                        "function_analysis": progression_analysis.function_analysis,
                        "key_modulations": progression_analysis.key_modulations,
                        "common_patterns": progression_analysis.common_patterns,
                        "complexity_score": progression_analysis.complexity_score,
                        "suggested_substitutions": progression_analysis.suggested_substitutions,
                        "mood_indicators": progression_analysis.mood_indicators
                    },
                    "structural_analysis": {
                        "sections": structural_analysis.sections,
                        "repetition_score": structural_analysis.repetition_score,
                        "development_arc": structural_analysis.development_arc,
                        "climax_points": structural_analysis.climax_points
                    },
                    "practice_suggestions": practice_suggestions
                }
            except Exception as e:
                print(f"Intelligence analysis failed: {e}")
                intelligence_data = {"error": f"Intelligence analysis failed: {str(e)}"}
            
            # Create result object
            result = {
                "chords": chords,
                "key": key,
                "tempo": round(tempo, 2),
                "duration": round(duration, 2),
                "youtube_url": url,
                "timestamp": str(datetime.datetime.now()),
                "intelligence": intelligence_data
            }
            
            # Save analysis results
            video_id = extract_youtube_id(url)
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            json_filename = f"{timestamp}_youtube_{video_id}.json"
            
            script_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(script_dir)
            song_chords_dir = os.path.join(project_root, "SongChords")
            os.makedirs(song_chords_dir, exist_ok=True)
            
            json_path = os.path.join(song_chords_dir, json_filename)
            with open(json_path, 'w') as f:
                json.dump(result, f, indent=2)
            print(f"Saved YouTube chord analysis to {json_path}")
            
            return result
            
        except Exception as e:
            print(f"Error in audio processing: {str(e)}")
            return {"error": f"Failed to process audio: {str(e)}"}
        finally:
            # Clean up temporary files
            if 'audio_path' in locals() and os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                    os.rmdir(os.path.dirname(audio_path))
                except:
                    pass
    
    except Exception as e:
        print(f"Error in analyze_youtube: {str(e)}")
        return {"error": f"Failed to analyze YouTube video: {str(e)}"}

@app.post("/api/analyze-lyrics")
async def analyze_lyrics(
    request: Request,
    file: Optional[UploadFile] = File(None),
    youtubeUrl: Optional[str] = Form(None),
    language: Optional[str] = Form(None)
):
    """Analyze lyrics from YouTube URL or uploaded audio file"""
    try:
        # Parse request
        content_type = request.headers.get('content-type', '')
        if 'application/json' in content_type:
            body = await request.json()
            youtubeUrl = body.get('youtubeUrl')
            language = body.get('language', 'auto')
        else:
            language = language or 'auto'
        
        # Process based on input type
        if youtubeUrl:
            return await process_youtube_lyrics(youtubeUrl, language)
        elif file:
            return await process_audio_file_lyrics(file, language)
        else:
            return {"error": "No YouTube URL or audio file provided"}
    
    except Exception as e:
        print(f"Error in analyze_lyrics: {str(e)}")
        return {"error": f"Failed to analyze lyrics: {str(e)}"}

async def process_youtube_lyrics(youtube_url: str, language: str = "auto"):
    """Process YouTube URL for lyrics extraction"""
    try:
        # Download audio
        audio_path = download_youtube_audio(youtube_url)
        
        # Extract lyrics
        lyrics = extract_lyrics_from_audio(audio_path, language)
        
        # Get video info
        with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
            video_info = ydl.extract_info(youtube_url, download=False)
        
        video_title = video_info.get('title', 'Unknown YouTube Video')
        video_id = video_info.get('id', '')
        
        # Create results
        results = {
            "lyrics": lyrics,
            "title": video_title,
            "youtube_url": youtube_url,
            "video_id": video_id,
            "detectedLanguage": lyrics[0].get("language") if lyrics else None,
            "duration": video_info.get('duration'),
            "timestamp": str(datetime.datetime.now())
        }
        
        # Save results
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        json_filename = f"{timestamp}_lyrics_youtube_{video_id}.json"
        
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        lyrics_dir = os.path.join(project_root, "LyricsData")
        os.makedirs(lyrics_dir, exist_ok=True)
        
        json_path = os.path.join(lyrics_dir, json_filename)
        with open(json_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        return results
    
    except Exception as e:
        print(f"Error processing YouTube lyrics: {str(e)}")
        return {"error": f"Failed to process YouTube lyrics: {str(e)}"}
    finally:
        if 'audio_path' in locals() and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
                os.rmdir(os.path.dirname(audio_path))
            except:
                pass

async def process_audio_file_lyrics(file: UploadFile, language: str = "auto"):
    """Process uploaded audio file for lyrics extraction"""
    temp_file = None
    try:
        if not file or not file.filename:
            return {"error": "Invalid file upload"}
        
        # Save uploaded file
        file_ext = os.path.splitext(file.filename)[1].lower() or '.wav'
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_ext)
        temp_path = temp_file.name
        temp_file.close()
        
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)
        
        # Extract lyrics
        lyrics = extract_lyrics_from_audio(temp_path, language)
        
        # Get duration
        try:
            y, sr = librosa.load(temp_path)
            duration = librosa.get_duration(y=y, sr=sr)
        except Exception as e:
            print(f"Error getting duration: {e}")
            duration = None
        
        # Create results
        results = {
            "lyrics": lyrics,
            "detectedLanguage": lyrics[0].get("language") if lyrics else None,
            "title": file.filename,
            "duration": duration,
            "timestamp": str(datetime.datetime.now())
        }
        
        # Save results
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename_safe = ''.join(c if c.isalnum() else '_' for c in file.filename)
        json_filename = f"{timestamp}_lyrics_{filename_safe}.json"
        
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        lyrics_dir = os.path.join(project_root, "LyricsData")
        os.makedirs(lyrics_dir, exist_ok=True)
        
        json_path = os.path.join(lyrics_dir, json_filename)
        with open(json_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        return results
    
    except Exception as e:
        print(f"Error processing audio file lyrics: {str(e)}")
        return {"error": f"Failed to process audio file lyrics: {str(e)}"}
    finally:
        if temp_file and os.path.exists(temp_file.name):
            try:
                os.remove(temp_file.name)
            except:
                pass

def extract_lyrics_from_audio(audio_path: str, preferred_language: str = "auto") -> List[Dict]:
    """Extract lyrics from audio file"""
    recognizer = sr.Recognizer()
    
    language_map = {
        "english": "en-US",
        "french": "fr-FR",
        "spanish": "es-ES",
        "german": "de-DE",
        "italian": "it-IT",
        "portuguese": "pt-PT",
        "russian": "ru-RU",
        "japanese": "ja-JP",
        "korean": "ko-KR",
        "chinese": "zh-CN",
        "arabic": "ar-SA",
        "auto": None
    }
    
    language_code = language_map.get(preferred_language.lower())
    
    # Convert audio to WAV format for speech recognition
    temp_wav_path = None
    try:
        y, sample_rate = librosa.load(audio_path)
        duration = librosa.get_duration(y=y, sr=sample_rate)
        
        # Create a temporary WAV file for speech recognition
        temp_wav_path = tempfile.NamedTemporaryFile(delete=False, suffix='.wav').name
        import soundfile as sf
        sf.write(temp_wav_path, y, sample_rate)
        
    except Exception as e:
        print(f"Error loading audio file: {str(e)}")
        return [{"text": f"Error loading audio file: {str(e)}", 
                "startTime": 0, 
                "endTime": 0, 
                "language": "english"}]
    
    chunk_duration = 10  # seconds
    lyrics = []
    errors = []
    
    try:
        with sr.AudioFile(temp_wav_path) as source:
            try:
                recognizer.adjust_for_ambient_noise(source)
            except Exception as e:
                print(f"Warning: Could not adjust for ambient noise: {str(e)}")
            
            for i in range(0, int(duration), chunk_duration):
                start_time = i
                end_time = min(i + chunk_duration, duration)
                
                try:
                    audio = recognizer.record(source, duration=chunk_duration, offset=start_time)
                    
                    # Handle language detection
                    if preferred_language.lower() == "auto":
                        # Try the most common languages first
                        detected_lang = None
                        text = None
                        
                        for lang in ["english", "spanish", "french", "german"]:
                            try:
                                lang_code = language_map[lang]
                                text = recognizer.recognize_google(audio, language=lang_code)
                                detected_lang = lang
                                break
                            except sr.UnknownValueError:
                                continue
                            except:
                                continue
                        
                        if not text:
                            # Try other languages
                            for lang, code in language_map.items():
                                if lang not in ["auto", "english", "spanish", "french", "german"] and code:
                                    try:
                                        text = recognizer.recognize_google(audio, language=code)
                                        detected_lang = lang
                                        break
                                    except:
                                        continue
                    else:
                        text = recognizer.recognize_google(audio, language=language_code)
                        detected_lang = preferred_language.lower()
                    
                    if text:
                        lyrics.append({
                            "text": text,
                            "startTime": start_time,
                            "endTime": end_time,
                            "language": detected_lang or "unknown"
                        })
                    
                except sr.UnknownValueError:
                    # No speech detected in this segment
                    continue
                except sr.RequestError as e:
                    error_msg = f"API request error at {start_time}-{end_time}s: {str(e)}"
                    print(error_msg)
                    errors.append(error_msg)
                except Exception as e:
                    error_msg = f"Error processing segment {start_time}-{end_time}s: {str(e)}"
                    print(error_msg)
                    errors.append(error_msg)
    
    except Exception as e:
        error_msg = f"Error extracting lyrics: {str(e)}"
        print(error_msg)
        return [{"text": error_msg,
                "startTime": 0,
                "endTime": duration,
                "language": "english",
                "errors": errors}]
    finally:
        # Clean up temporary WAV file
        if temp_wav_path and os.path.exists(temp_wav_path):
            try:
                os.remove(temp_wav_path)
            except:
                pass
    
    if not lyrics:
        return [{"text": "No lyrics detected in this audio.",
                "startTime": 0,
                "endTime": duration,
                "language": "english",
                "errors": errors}]
    
    # Add any errors to the response
    if errors:
        lyrics.append({
            "text": "Some segments had errors during processing",
            "startTime": duration,
            "endTime": duration,
            "language": "english",
            "errors": errors
        })
    
    return lyrics

@app.post("/analyze-intelligence")
async def analyze_intelligence(request: Request):
    """Enhanced intelligent analysis of existing chord data"""
    try:
        data = await request.json()
        chords = data.get("chords", [])
        key = data.get("key", "")
        tempo = data.get("tempo", 120)
        duration = data.get("duration", 0)
        
        if not chords or not key:
            return {"error": "Missing required chord data or key information"}
        
        print(f"Performing intelligent analysis on {len(chords)} chords in key {key}")
        
        try:
            # Apply comprehensive intelligent analysis
            progression_analysis = music_intelligence.analyze_progression_intelligence(chords, key)
            structural_analysis = music_intelligence.analyze_song_structure(chords, duration)
            practice_suggestions = music_intelligence.generate_practice_suggestions(chords, key, tempo)
            
            # Get advanced insights
            harmonic_insights = music_intelligence._analyze_harmonic_rhythm(chords)
            mood_analysis = music_intelligence._analyze_mood_progression(chords, key)
            difficulty_assessment = music_intelligence._assess_difficulty(chords, tempo)
            
            result = {
                "progression_analysis": {
                    "function_analysis": progression_analysis.function_analysis,
                    "key_modulations": progression_analysis.key_modulations,
                    "common_patterns": progression_analysis.common_patterns,
                    "complexity_score": progression_analysis.complexity_score,
                    "suggested_substitutions": progression_analysis.suggested_substitutions,
                    "mood_indicators": progression_analysis.mood_indicators
                },
                "structural_analysis": {
                    "sections": structural_analysis.sections,
                    "repetition_score": structural_analysis.repetition_score,
                    "development_arc": structural_analysis.development_arc,
                    "climax_points": structural_analysis.climax_points
                },
                "practice_suggestions": practice_suggestions,
                "advanced_insights": {
                    "harmonic_rhythm": harmonic_insights,
                    "mood_progression": mood_analysis,
                    "difficulty_assessment": difficulty_assessment
                },
                "timestamp": str(datetime.datetime.now())
            }
            
            return result
            
        except Exception as e:
            print(f"Intelligence analysis error: {str(e)}")
            return {"error": f"Intelligence analysis failed: {str(e)}"}
            
    except Exception as e:
        print(f"Error in analyze_intelligence: {str(e)}")
        return {"error": f"Failed to perform intelligent analysis: {str(e)}"}

# Real-time chord detection models
class AudioChunk(BaseModel):
    audio_data: str  # Base64 encoded audio data
    sample_rate: int = 44100
    chunk_duration: float = 0.5  # Duration in seconds

class RealTimeChordResponse(BaseModel):
    chord: str
    confidence: float
    timestamp: float
    key: Optional[str] = None
    capo_position: Optional[int] = None

class CapoSettings(BaseModel):
    capo_position: int = 0  # 0-12 frets
    tuning: str = "standard"  # standard, drop_d, etc.

# Global capo settings
current_capo_settings = CapoSettings()

@app.post("/api/real-time-chord")
async def detect_real_time_chord(audio_chunk: AudioChunk) -> RealTimeChordResponse:
    """Detect chord from real-time audio chunk for Capo-like functionality"""
    try:
        import base64
        import io
        
        # Decode base64 audio data
        audio_bytes = base64.b64decode(audio_chunk.audio_data)
        
        # Convert raw PCM int16 data to float32
        y = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32767.0
        sr = audio_chunk.sample_rate
        
        # Ensure we have audio data
        if len(y) == 0:
            return RealTimeChordResponse(
                chord="N",
                confidence=0.0,
                timestamp=datetime.datetime.now().timestamp(),
                capo_position=current_capo_settings.capo_position
            )
        
        # Apply harmonic-percussive separation for cleaner detection
        y_harmonic, _ = librosa.effects.hpss(y, margin=(1.0, 5.0))
        
        # Skip if very low energy
        if np.sum(y_harmonic) < 0.001:
            return RealTimeChordResponse(
                chord="N",
                confidence=0.0,
                timestamp=datetime.datetime.now().timestamp(),
                capo_position=current_capo_settings.capo_position
            )
        
        # Use optimized real-time detection
        chord, confidence = optimized_realtime_detector.detect_chord_fast(y_harmonic, sr)
        
        # Apply capo transposition if set
        if current_capo_settings.capo_position > 0 and chord != "N":
            chord = transpose_chord_for_capo(chord, current_capo_settings.capo_position)
        
        return RealTimeChordResponse(
            chord=chord,
            confidence=confidence,
            timestamp=datetime.datetime.now().timestamp(),
            capo_position=current_capo_settings.capo_position
        )
        
    except Exception as e:
        print(f"Error in real-time chord detection: {str(e)}")
        return RealTimeChordResponse(
            chord="N",
            confidence=0.0,
            timestamp=datetime.datetime.now().timestamp()
        )

@app.post("/api/set-capo")
async def set_capo_position(settings: CapoSettings):
    """Set capo position for chord transposition"""
    global current_capo_settings
    current_capo_settings = settings
    return {"status": "success", "capo_position": settings.capo_position}

@app.get("/api/capo-settings")
async def get_capo_settings():
    """Get current capo settings"""
    return current_capo_settings

def transpose_chord_for_capo(chord: str, capo_position: int) -> str:
    """Transpose chord based on capo position"""
    if chord == "N" or capo_position == 0:
        return chord
    
    try:
        # Extract root note and chord type
        parts = chord.split()
        if len(parts) < 2:
            return chord
            
        root = parts[0]
        chord_type = " ".join(parts[1:])
        
        # Find root in chromatic scale
        notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        if root in notes:
            # Transpose down by capo position (what guitarist sees vs actual pitch)
            root_index = notes.index(root)
            new_root_index = (root_index - capo_position) % 12
            new_root = notes[new_root_index]
            return f"{new_root} {chord_type}"
        
        return chord
    except:
        return chord

@app.post("/api/analyze-audio-stream")
async def analyze_audio_stream(file: UploadFile = File(...)):
    """Analyze longer audio stream with improved chord detection"""
    try:
        # Save uploaded file temporarily
        contents = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            tmp_file.write(contents)
            tmp_path = tmp_file.name

        # Load and process audio
        y, sr = librosa.load(tmp_path)
        y_harmonic, _ = librosa.effects.hpss(y)
        duration = librosa.get_duration(y=y, sr=sr)
        
        # Use improved chord detection
        chords = improved_chord_detector.detect_chords_improved(y_harmonic, sr)
        
        # Detect key
        key, key_confidence = improved_chord_detector.detect_key_improved(y_harmonic, sr)
        
        # Clean up
        os.unlink(tmp_path)
        
        return {
            "chords": chords,
            "key": key,
            "key_confidence": key_confidence,
            "duration": duration,
            "analysis_method": "improved_detection"
        }
        
    except Exception as e:
        print(f"Error in stream analysis: {str(e)}")
        return {"error": str(e)}

# WebSocket support for real-time streaming
from fastapi import WebSocket, WebSocketDisconnect
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_chord_update(self, chord_data: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(chord_data)
            except:
                # Connection is probably closed
                pass

manager = ConnectionManager()

@app.websocket("/api/ws/real-time-chords")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Wait for audio data from client
            data = await websocket.receive_json()
            print(f"WebSocket received message type: {data.get('type')}")  # Debug log
            
            if data.get("type") == "audio_chunk":
                # Process audio chunk
                audio_chunk = AudioChunk(**data["data"])
                print(f"Processing audio chunk: {len(audio_chunk.audio_data)} bytes base64")  # Debug log
                chord_response = await detect_real_time_chord(audio_chunk)
                print(f"Detected chord: {chord_response.chord} (confidence: {chord_response.confidence:.3f})")  # Debug log
                
                # Send back chord detection
                await websocket.send_json({
                    "type": "chord_update",
                    "data": chord_response.dict()
                })
                
            elif data.get("type") == "capo_change":
                # Update capo settings
                settings = CapoSettings(**data["data"])
                await set_capo_position(settings)
                
                await websocket.send_json({
                    "type": "capo_updated",
                    "data": settings.dict()
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
