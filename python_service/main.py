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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Music Intelligence Engine
music_intelligence = MusicIntelligenceEngine()

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
        print(f"Starting analysis of file: {file.filename}")
        y, sr = librosa.load(tmp_path)
        y_harmonic, _ = librosa.effects.hpss(y)
        duration = librosa.get_duration(y=y, sr=sr)
        
        # Detect tempo and key
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        overall_fragment = Tonal_Fragment(y_harmonic, sr)
        key = overall_fragment.key
        
        # Detect chords every second
        bin_size = 1
        chords = []
        for i in range(0, int(duration)//bin_size):
            tstart = bin_size * i
            tend = bin_size * (i+1)
            fragment = Tonal_Fragment(y_harmonic, sr, tstart=tstart, tend=tend)
            chords.append({
                "time": tstart,
                "chord": fragment.key
            })
        
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
            
            # Analyze the audio
            print("Starting audio analysis...")
            y, sr = librosa.load(audio_path)
            y_harmonic, _ = librosa.effects.hpss(y)
            duration = float(librosa.get_duration(y=y, sr=sr))  # Convert to Python float
            
            print(f"Audio loaded successfully. Duration: {duration:.2f} seconds")
            
            # Detect tempo and key
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            tempo = float(tempo[0]) if hasattr(tempo, '__len__') and len(tempo) > 0 else float(tempo)  # Handle array or scalar
            overall_fragment = Tonal_Fragment(y_harmonic, sr)
            key = overall_fragment.key
            
            print(f"Detected key: {key}, tempo: {tempo:.2f}")
            
            # Detect chords every second
            bin_size = 1
            chords = []
            chord_count = int(duration)//bin_size
            print(f"Analyzing {chord_count} chord segments...")
            
            for i in range(0, chord_count):
                tstart = bin_size * i
                tend = bin_size * (i+1)
                fragment = Tonal_Fragment(y_harmonic, sr, tstart=tstart, tend=tend)
                chords.append({
                    "time": tstart,
                    "chord": fragment.key
                })
            
            print(f"Analysis complete. Found {len(chords)} chords.")
            
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

if __name__ == "__main__":
    # Ensure directories exist
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    for dir_name in ["SongChords", "LyricsData", "uploads"]:
        dir_path = os.path.join(project_root, dir_name)
        if not os.path.exists(dir_path):
            print(f"Creating {dir_name} directory")
            os.makedirs(dir_path, exist_ok=True)
    
    # Start servers
    print("Starting Python service on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
