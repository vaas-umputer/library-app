CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  total_copies INT NOT NULL,
  available_copies INT NOT NULL
);
	
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  book_id INT NOT NULL REFERENCES books(id),
  user_id INT REFERENCES users(id),
  borrowed_at TIMESTAMP DEFAULT now(),
  returned_at TIMESTAMP
);

