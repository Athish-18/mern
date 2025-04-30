import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import UpdateListing from './UpdateListing';

// ✅ Mock global fetch to prevent ReferenceError
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        title: 'Mock Listing Title',
        description: 'Mock listing description',
        regularPrice: 1000,
        discountedPrice: 800,
        bathrooms: 2,
        bedrooms: 3,
        address: '123 Mock Street',
        furnished: true,
        parking: true,
        type: 'sale',
        offer: true,
        imageUrls: [],
        userRef: 'user123',
      }),
  })
);

// ✅ Mock firebase.js (prevents import.meta.env crash)
jest.mock('../firebase', () => ({
  app: {},
}));

// ✅ Mock firebase/storage functions if used
jest.mock('firebase/storage', () => ({
  getStorage: () => ({}),
  ref: () => ({}),
  uploadBytesResumable: jest.fn(),
  getDownloadURL: jest.fn(() => Promise.resolve('mock-url')),
}));

const mockStore = configureStore([]);

describe('UpdateListing Page', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      user: {
        currentUser: {
          _id: 'user123',
        },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <UpdateListing />
        </MemoryRouter>
      </Provider>
    );
  });

  it('renders the Update Listing page without crashing', () => {
    expect(screen.getByText(/update listing/i)).toBeInTheDocument();
  });
});
