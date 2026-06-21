const BASE_URL = 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('token');
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  localStorage.setItem('token', data.token);
  return data;
}

export async function getBooks() {
  const res = await fetch(`${BASE_URL}/books`);
  return res.json();
}

export async function borrowBook(bookId) {
  const res = await fetch(`${BASE_URL}/books/${bookId}/borrow`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  return res.json();
}