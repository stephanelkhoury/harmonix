import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import Mp3Upload from '../Mp3Upload';

jest.mock('axios');

describe('Mp3Upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders upload form', () => {
    render(<Mp3Upload />);
    expect(screen.getByRole('button')).toHaveTextContent('Upload');
  });

  test('handles file upload success', async () => {
    const mockChords = [
      { time: 0, chord: 'C' },
      { time: 3, chord: 'G' }
    ];
    
    axios.post.mockResolvedValueOnce({ data: { chords: mockChords } });
    
    render(<Mp3Upload />);
    
    const file = new File(['dummy content'], 'test.mp3', { type: 'audio/mp3' });
    const input = screen.getByRole('button');
    
    await waitFor(() => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    
    expect(await screen.findByText('0s: C')).toBeInTheDocument();
    expect(await screen.findByText('3s: G')).toBeInTheDocument();
  });

  test('handles upload error', async () => {
    axios.post.mockRejectedValueOnce(new Error('Upload failed'));
    
    render(<Mp3Upload />);
    
    const file = new File(['dummy content'], 'test.mp3', { type: 'audio/mp3' });
    const input = screen.getByRole('button');
    
    await waitFor(() => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    
    expect(await screen.findByText('Upload failed.')).toBeInTheDocument();
  });
});