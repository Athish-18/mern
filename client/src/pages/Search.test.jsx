import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import Search from './Search';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

beforeEach(() => {
  fetchMock.resetMocks();

  // Mock window.location
  delete window.location;
  window.location = new URL('http://localhost/search?searchTerm=test');
});

test('renders Search component', async () => {
  fetchMock.mockResponseOnce(JSON.stringify([]));

  await act(async () => {
    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );
  });

  expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
});
