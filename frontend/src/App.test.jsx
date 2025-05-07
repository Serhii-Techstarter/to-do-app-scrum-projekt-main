import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

global.fetch = vi.fn();

describe('To-Do App - Kategorie erstellen', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('sollte eine neue Kategorie erstellen können', async () => {
    // Mock für das Laden der Kategorien
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [], // Keine Kategorien initial
    });

    // Mock für das Hinzufügen einer neuen Kategorie
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, name: 'Neue Kategorie' }),
    });

    render(<App />);

    // Warten, bis die Kategorien geladen sind
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('http://localhost:3050/categories'));

    // Eingabefeld und Button finden
    const input = screen.getByPlaceholderText('New Category...');
    const addButton = screen.getByText('Add Category');

    // Eingabe simulieren
    fireEvent.change(input, { target: { value: 'Neue Kategorie' } });

    // Button klicken
    fireEvent.click(addButton);

    // Warten, bis die neue Kategorie angezeigt wird
    await waitFor(() => {
      expect(screen.getByText('Neue Kategorie (0/0)')).toBeInTheDocument();
    });

    // Überprüfen, ob der richtige API-Aufruf gemacht wurde
    expect(fetch).toHaveBeenCalledWith('http://localhost:3050/add_category', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Neue Kategorie' }),
    }));
  });
});