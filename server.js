const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Enable the content route
app.use('/api/content', require('./routes/content'));

// Other routes (you can uncomment later)
app.use('/api/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));

app.get('/', (req, res) => {
  res.send('ICON Streaming backend');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
