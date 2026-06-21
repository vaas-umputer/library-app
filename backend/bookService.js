const pool = require('./db');

async function borrowBook(bookId, userName) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateResult = await client.query(
      `UPDATE books
       SET available_copies = available_copies - 1
       WHERE id = $1 AND available_copies > 0
       RETURNING *`,
      [bookId]
    );

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      const exists = await client.query('SELECT id FROM books WHERE id = $1', [bookId]);
      if (exists.rows.length === 0) {
        return { error: 'NOT_FOUND' };
      }
      return { error: 'UNAVAILABLE' };
    }

    await client.query(
      'INSERT INTO loans (book_id, user_name) VALUES ($1, $2)',
      [bookId, userName]
    );

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function returnBook(bookId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateResult = await client.query(
        `UPDATE loans
         SET returned_at = now()
         WHERE book_id = $1 AND user_name = $2 AND returned_at IS NULL`,
        [bookId, userName]  
    );

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      const exists = await client.query('SELECT id FROM books WHERE id = $1', [bookId]);
      if (exists.rows.length === 0) {
        return { error: 'NOT_FOUND' };
      }
      const activeLoan = await client.query(
        'SELECT id FROM loans WHERE book_id = $1 AND user_name = $2 AND returned_at IS NULL',
        [bookId, userName]
      );
      if (activeLoan.rows.length === 0) {
        return { error: 'NO_ACTIVE_LOAN' };
      }
    }

    await client.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = $1',
      [bookId]
    );

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { borrowBook, returnBook };