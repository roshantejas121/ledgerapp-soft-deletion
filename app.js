const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const usersRoute = require('./routes/users');
const accountsRoute = require('./routes/accounts');
const transactionsRoute = require('./routes/transactions');
const auditRoute = require('./routes/audit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/users', usersRoute);
app.use('/accounts', accountsRoute);
app.use('/transactions', transactionsRoute);
app.use('/audit', auditRoute);
app.get('/', (req, res) => res.json({ message: 'LedgerApp API is running' }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
