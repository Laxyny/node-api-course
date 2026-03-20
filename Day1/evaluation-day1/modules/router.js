const { readDB, writeDB } = require('./db');

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
  return statusCode;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('JSON invalide'));
      }
    });
  });
}

async function router(req, res) {
  const method = req.method;
  const [pathname, queryString] = req.url.split('?');

  const query = {};
  if (queryString) {
    queryString.split('&').forEach((param) => {
      const [key, value] = param.split('=');
      query[key] = value;
    });
  }

  const bookByIdMatch = pathname.match(/^\/books\/(\d+)$/);

  if (method === 'GET' && pathname === '/books') {
    const db = await readDB();
    let books = db.books;

    if (query.available !== undefined) {
      const filterValue = query.available === 'true';
      books = books.filter((b) => b.available === filterValue);
    }

    return sendJSON(res, 200, { success: true, count: books.length, data: books });
  }

  if (method === 'GET' && bookByIdMatch) {
    const id = parseInt(bookByIdMatch[1]);
    const db = await readDB();
    const book = db.books.find((b) => b.id === id);

    if (!book) {
      return sendJSON(res, 404, { success: false, error: 'Livre introuvable' });
    }

    return sendJSON(res, 200, { success: true, data: book });
  }

  if (method === 'POST' && pathname === '/books') {
    let parsed;
    try {
      parsed = await parseBody(req);
    } catch {
      return sendJSON(res, 400, { success: false, error: 'JSON invalide' });
    }

    if (!parsed.title || !parsed.author || !parsed.year) {
      return sendJSON(res, 400, { success: false, error: 'Les champs title, author et year sont requis' });
    }

    const db = await readDB();
    const maxId = db.books.length > 0 ? Math.max(...db.books.map((b) => b.id)) : 0;
    const newBook = {
      id: maxId + 1,
      title: parsed.title,
      author: parsed.author,
      year: parsed.year,
      available: true,
    };

    db.books.push(newBook);
    await writeDB(db);

    return sendJSON(res, 201, { success: true, data: newBook });
  }

  if (method === 'DELETE' && bookByIdMatch) {
    const id = parseInt(bookByIdMatch[1]);
    const db = await readDB();
    const index = db.books.findIndex((b) => b.id === id);

    if (index === -1) {
      return sendJSON(res, 404, { success: false, error: 'Livre introuvable' });
    }

    db.books.splice(index, 1);
    await writeDB(db);

    return sendJSON(res, 200, { success: true, message: 'Livre supprimé' });
  }

  return sendJSON(res, 404, { success: false, error: 'Route non trouvée' });
}

module.exports = { router };
