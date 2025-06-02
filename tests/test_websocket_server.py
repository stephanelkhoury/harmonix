#!/usr/bin/env python3
"""
Simple WebSocket server to test frontend connectivity
"""
import asyncio
import json
import websockets
import base64

async def echo_handler(websocket, path):
    print(f"Client connected from path: {path}")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                print(f"Received message type: {data.get('type')}")
                
                if data.get('type') == 'audio_chunk':
                    audio_data = data.get('data', {}).get('audio_data', '')
                    print(f"Audio data length: {len(audio_data)} base64 chars")
                    
                    # Decode and check audio
                    try:
                        audio_bytes = base64.b64decode(audio_data)
                        print(f"Decoded audio: {len(audio_bytes)} bytes")
                        
                        # Send back a test chord
                        response = {
                            "type": "chord_update",
                            "data": {
                                "chord": "C major",
                                "confidence": 0.85,
                                "capo_position": 0
                            }
                        }
                        await websocket.send(json.dumps(response))
                        print("Sent test chord response")
                        
                    except Exception as e:
                        print(f"Error decoding audio: {e}")
                        
                elif data.get('type') == 'test':
                    response = {
                        "type": "test_response", 
                        "data": {"message": "Test received!"}
                    }
                    await websocket.send(json.dumps(response))
                    print("Sent test response")
                    
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")

async def main():
    # Start server on port 8001 to avoid conflict
    print("WebSocket test server starting on ws://localhost:8001")
    print("Press Ctrl+C to stop")
    
    async with websockets.serve(echo_handler, "localhost", 8001):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
