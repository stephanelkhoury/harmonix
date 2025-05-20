from fastapi import FastAPI, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn
import librosa
import numpy as np
import tempfile
import os
import subprocess
import json
import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring and startup verification"""
    return {"status": "healthy", "service": "python_service"}

# Tonal_Fragment class from your notebook
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
            self.maj_key_corrs.append(round(np.corrcoef(maj_profile, key_test)[1,0], 3))
            self.min_key_corrs.append(round(np.corrcoef(min_profile, key_test)[1,0], 3))
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

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    print(f"Received file: {file.filename}")
    # Save uploaded file to a temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp:
        try:
            content = await file.read()
            print(f"File size: {len(content)} bytes")
            tmp.write(content)
            tmp_path = tmp.name
        except Exception as e:
            print(f"Error reading uploaded file: {str(e)}")
            return {"error": f"Failed to process upload: {str(e)}"}
    
    try:
        # Load and analyze the audio
        print(f"Starting analysis of file: {file.filename} at path: {tmp_path}")
        y, sr = librosa.load(tmp_path)
        y_harmonic, _ = librosa.effects.hpss(y)
        duration = librosa.get_duration(y=y, sr=sr)
        
        # Detect tempo
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        
        # Detect overall key
        overall_fragment = Tonal_Fragment(y_harmonic, sr)
        key = overall_fragment.key
        
        # Detect chords every second instead of every 3 seconds
        bin_size = 1  # second
        chords = []
        for i in range(0, int(duration)//bin_size):
            tstart = bin_size * i
            tend = bin_size * (i+1)
            fragment = Tonal_Fragment(y_harmonic, sr, tstart=tstart, tend=tend)
            chords.append({
                "time": tstart,
                "chord": fragment.key
            })
        
        # Create a result object with all the information
        result = {
            "chords": chords,
            "key": key,
            "tempo": round(tempo, 2),
            "duration": round(duration, 2),
            "filename": file.filename,
            "timestamp": str(datetime.datetime.now())
        }
        
        # Save the analysis to a JSON file in the SongChords directory
        filename_safe = ''.join(c if c.isalnum() else '_' for c in file.filename)
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        json_filename = f"{timestamp}_{filename_safe}.json"
        
        # Use a relative path from the current script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        song_chords_dir = os.path.join(project_root, "SongChords")
        
        # Ensure directory exists
        os.makedirs(song_chords_dir, exist_ok=True)
        
        json_path = os.path.join(song_chords_dir, json_filename)
        
        try:
            with open(json_path, 'w') as f:
                json.dump(result, f, indent=2)
            print(f"Saved chord analysis to {json_path}")
        except Exception as e:
            print(f"Error saving chord analysis: {str(e)}")
            # Return result even if saving fails
        
        return result
    finally:
        os.remove(tmp_path)

@app.post("/analyze-youtube")
async def analyze_youtube(request: Request):
    data = await request.json()
    url = data.get("url")
    if not url:
        return {"error": "No YouTube URL provided."}
    
    with tempfile.TemporaryDirectory() as tmpdir:
        audio_path = os.path.join(tmpdir, "audio.mp3")
        # Download audio using yt-dlp with more detailed error handling
        try:
            print(f"Attempting to download YouTube audio from: {url}")
            print(f"Using temporary path: {audio_path}")
            
            # Find the ffmpeg path - try multiple possible locations
            possible_ffmpeg_paths = [
                "/opt/homebrew/bin/ffmpeg",  # Homebrew on Apple Silicon
                "/usr/local/bin/ffmpeg",     # Homebrew on Intel Mac
                "/usr/bin/ffmpeg"            # Default system location
            ]
            
            # Check if ffmpeg exists in any of these locations
            ffmpeg_path = None
            for path in possible_ffmpeg_paths:
                if os.path.exists(path):
                    ffmpeg_path = path
                    print(f"Found ffmpeg at: {ffmpeg_path}")
                    break
            
            # If not found in standard locations, try to find it in PATH
            if not ffmpeg_path:
                try:
                    ffmpeg_path = subprocess.check_output(["which", "ffmpeg"], text=True).strip()
                    print(f"Found ffmpeg in PATH at: {ffmpeg_path}")
                except subprocess.CalledProcessError:
                    print("ffmpeg not found in PATH")
            
            if not ffmpeg_path:
                print("WARNING: ffmpeg not found. YouTube downloads may fail.")
            
            # Download the video directly as MP3 using more robust settings
            cmd = [
                "yt-dlp", 
                "-v",                      # Verbose output
                "-x",                      # Extract audio
                "--audio-format", "mp3",   # Output format
                "--audio-quality", "192K", # Set quality to avoid huge files
                "--no-playlist",           # Don't download playlists
                "--geo-bypass",            # Try to bypass geo-restrictions
                "--force-ipv4",            # Force IPv4 to avoid IPv6 issues
                "--no-check-certificate",  # Skip HTTPS certificate validation
                "--extract-audio",         # Make sure to extract audio
                "--prefer-ffmpeg",         # Prefer using ffmpeg for conversion
                "--progress",              # Show progress
                "--hls-prefer-native",     # Use native HLS downloader
                "-o", audio_path           # Output path
            ]
            
            # Add ffmpeg path if found
            if ffmpeg_path:
                cmd.extend(["--ffmpeg-location", ffmpeg_path])
                # Also make sure FFmpeg is in the environment PATH
                os.environ["PATH"] = f"{os.path.dirname(ffmpeg_path)}:{os.environ.get('PATH', '')}"
            
            # Add the URL at the end
            cmd.append(url)
            
            print(f"Running command: {' '.join(cmd)}")
            result = subprocess.run(
                cmd, 
                check=False, 
                capture_output=True, 
                text=True
            )
            
            if result.returncode != 0:
                error_msg = f"YouTube download failed: {result.stderr}"
                print(error_msg)
                
                # Return error instead of placeholder chords for better debugging
                return {
                    "error": "YouTube download failed. Please check URL or try a different video.",
                    "details": error_msg,
                    "url": url,
                    "timestamp": str(datetime.datetime.now())
                }
            
            # Verify the file actually exists
            if not os.path.exists(audio_path):
                # Check if yt-dlp created a file with a different extension
                possible_files = [f for f in os.listdir(tmpdir) if f.endswith(('.mp3', '.m4a', '.webm'))]
                if possible_files:
                    # Use the first audio file found
                    audio_path = os.path.join(tmpdir, possible_files[0])
                    print(f"Found alternative audio file: {audio_path}")
                else:
                    return {
                        "error": "YouTube download produced no audio file.",
                        "url": url,
                        "timestamp": str(datetime.datetime.now())
                    }
            
            print(f"YouTube download completed successfully to {audio_path}")
        except Exception as e:
            error_msg = f"Exception during YouTube download: {str(e)}"
            print(error_msg)
            
            return {
                "error": "Exception during YouTube download.",
                "details": error_msg,
                "url": url,
                "timestamp": str(datetime.datetime.now())
            }
        # Analyze as before
        try:
            y, sr = librosa.load(audio_path)
            y_harmonic, _ = librosa.effects.hpss(y)
            duration = librosa.get_duration(y=y, sr=sr)
            
            # Detect tempo
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            
            # Detect overall key
            overall_fragment = Tonal_Fragment(y_harmonic, sr)
            key = overall_fragment.key
            
            # Detect chords every second instead of every 3 seconds
            bin_size = 1  # second
            chords = []
            for i in range(0, int(duration)//bin_size):
                tstart = bin_size * i
                tend = bin_size * (i+1)
                fragment = Tonal_Fragment(y_harmonic, sr, tstart=tstart, tend=tend)
                chords.append({
                    "time": tstart,
                    "chord": fragment.key
                })
            
            # Create a result object with all the information
            result = {
                "chords": chords,
                "key": key,
                "tempo": round(tempo, 2),
                "duration": round(duration, 2),
                "youtube_url": url,
                "timestamp": str(datetime.datetime.now())
            }
            
            # Extract YouTube video ID from URL
            video_id = url.split("v=")[-1].split("&")[0]
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            json_filename = f"{timestamp}_youtube_{video_id}.json"
            
            # Use a relative path from the current script
            script_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(script_dir)
            song_chords_dir = os.path.join(project_root, "SongChords")
            
            # Ensure directory exists
            os.makedirs(song_chords_dir, exist_ok=True)
            
            json_path = os.path.join(song_chords_dir, json_filename)
            
            try:
                with open(json_path, 'w') as f:
                    json.dump(result, f, indent=2)
                print(f"Saved YouTube chord analysis to {json_path}")
            except Exception as e:
                print(f"Error saving YouTube chord analysis: {str(e)}")
            
            print(f"Saved YouTube chord analysis to {json_path}")
            
            return result
        except Exception as e:
            return {"error": f"Failed to analyze audio: {str(e)}"}

if __name__ == "__main__":
    # Check for required libraries
    try:
        import librosa
        print("✅ librosa is installed")
    except ImportError:
        print("❌ librosa is not installed. Run: pip install librosa")
    
    try:
        import numpy
        print("✅ numpy is installed")
    except ImportError:
        print("❌ numpy is not installed. Run: pip install numpy")
    
    # Check if SongChords directory exists and create it if needed
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    song_chords_dir = os.path.join(project_root, "SongChords")
    
    if not os.path.exists(song_chords_dir):
        print(f"Creating SongChords directory at {song_chords_dir}")
        os.makedirs(song_chords_dir, exist_ok=True)
    else:
        print(f"SongChords directory exists at {song_chords_dir}")
    
    # Check if uploads directory exists
    uploads_dir = os.path.join(project_root, "uploads")
    if not os.path.exists(uploads_dir):
        print(f"Creating uploads directory at {uploads_dir}")
        os.makedirs(uploads_dir, exist_ok=True)
    
    print(f"Starting Python service on port 8000...")
    print(f"Analysis results will be saved to: {song_chords_dir}")
    
    # Start the server with debug mode enabled
    try:
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="debug")
    except Exception as e:
        print(f"Error starting server: {str(e)}")
        print("If the port is already in use, try: lsof -i :8000 and kill the process")
