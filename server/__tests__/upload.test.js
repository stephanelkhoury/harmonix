const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = require('../index');

jest.mock('axios');
const axios = require('axios');

describe('Upload Endpoint', () => {
  const testFile = path.join(__dirname, 'test.mp3');
  
  beforeAll(() => {
    // Create a dummy test file
    fs.writeFileSync(testFile, 'dummy audio content');
  });

  afterAll(() => {
    // Clean up test file
    fs.unlinkSync(testFile);
  });

  it('should handle successful file upload', async () => {
    const mockResponse = {
      data: {
        chords: [
          { time: 0, chord: 'C' },
          { time: 3, chord: 'G' }
        ]
      }
    };
    
    axios.post.mockResolvedValueOnce(mockResponse);

    const response = await request(app)
      .post('/upload')
      .attach('mp3', testFile);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse.data);
  });

  it('should handle missing file', async () => {
    const response = await request(app)
      .post('/upload')
      .send();

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('No file uploaded');
  });

  it('should handle analysis service error', async () => {
    axios.post.mockRejectedValueOnce(new Error('Analysis failed'));

    const response = await request(app)
      .post('/upload')
      .attach('mp3', testFile);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Chord analysis failed');
  });
});