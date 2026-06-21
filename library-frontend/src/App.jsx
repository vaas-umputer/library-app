import { useState, useEffect } from 'react';
import { login, getBooks, borrowBook } from './api';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [books, setBooks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getBooks().then(setBooks);
  }, []);

  async function handleLogin() {
    try {
      await login(email, password);
      setError('');
      alert('Logged in');
    } catch {
      setError('Login failed');
    }
  }

  async function handleBorrow(id) {
    try {
      await borrowBook(id);
      const updated = await getBooks();
      setBooks(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Login</h2>
      <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Books</h2>
      {books.map(b => (
        <div key={b.id}>
          {b.title} — {b.available_copies} available
          <button onClick={() => handleBorrow(b.id)}>Borrow</button>
        </div>
      ))}
    </div>
  );
}

export default App;