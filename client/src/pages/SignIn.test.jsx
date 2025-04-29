import React from 'react'; // ← This fixes the new error
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';

// ✅ Mock Firebase to avoid import.meta.env error
jest.mock('../firebase', () => ({
  app: {}, // mock Firebase app
}));

import SignIn from './SignIn';

const mockStore = configureStore([]);

describe('SignIn Page', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      user: {
        loading: false,
        error: null,
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <SignIn />
        </MemoryRouter>
      </Provider>
    );
  });

  it('renders form inputs and sign in button', () => {
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it('allows typing into email and password fields', () => {
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('123456');
  });
});
