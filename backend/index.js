const express = require('express');
const pool = require('./db');
const { signup, login, verifyToken } = require('./auth');
const cors = require('cors');

const { borrowBook, returnBook } = require('./bookService');

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());


const allowedOrigins = [
  'http://localhost:5173',
  'https://library-app-frontend-a1s2.onrender.com',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    const user = await signup(email, password);
    res.status(201).json(user);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const token = await login(email, password);
  if (!token) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token });
});


// Middleware: protects any route placed after it
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });

  const token = header.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });

  req.user = payload; // now every protected route can read req.user.userId
  next();
}

app.get('/books', async (req,res)=>{
    const result = await pool.query('SELECT * FROM books');
    res.json(result.rows);
});

// Borrow a book — NAIVE VERSION (we will break this on purpose)
/* app.post('/books/:id/borrow', async (req, res) => {
  const bookId = req.params.id;
  const { user_name } = req.body;

  // Step A: check availability
  const bookResult = await pool.query(
    'SELECT * FROM books WHERE id = $1',
    [bookId]
  );
  const book = bookResult.rows[0];

  if (!book || book.available_copies <= 0) {
    return res.status(409).json({ error: 'No copies available' });
  }

  // Step B: decrement availability
  await pool.query(
    'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
    [bookId]
  );

  // Step C: record the loan
  await pool.query(
    'INSERT INTO loans (book_id, user_name) VALUES ($1, $2)',
    [bookId, user_name]
  );

  res.json({ message: `${user_name} borrowed book ${bookId}` });
});
*/

app.post('/books/:id/borrow',requireAuth, async (req, res) => {
  const bookId = req.params.id;
  const userId = req.user.userId;

  try {
    const result = await borrowBook(bookId, userId);
    if (result.error === 'NOT_FOUND') return res.status(404).json({ error: 'Book not found' });
    if (result.error === 'UNAVAILABLE') return res.status(409).json({ error: 'No copies available' });
    return res.status(201).json({ message: `Borrowed book ${bookId}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Return a book
app.post('/books/:id/return', requireAuth, async (req, res) => {
  const bookId = req.params.id;
  const userId = req.user.userId;

  try {
    const result = await returnBook(bookId, userId);
    if (result.error === 'NOT_FOUND') return res.status(404).json({ error: 'Book not found' });
    if(result.error === 'NO_ACTIVE_LOAN') return res.status(400).json({ error: 'No active loan found for this user and book' });
    return res.status(200).json({ message: `Successfully returned book ${bookId}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(PORT, () => console.log(`Listening on port ${PORT}`));