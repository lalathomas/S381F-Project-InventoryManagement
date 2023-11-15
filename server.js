const express = require('express');
const bodyParser = require('body-parser');
const session = require('cookie-session');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your-secret-key'; // Change this to a secure secret key
const MONGODB_URI = 'mongodb://localhost:27017/your-database-name'; // Update with your MongoDB connection string

const usersInfo = [
    { username: "user1", password: "password1" },
    { username: "user2", password: "password2" },
    // Add more users as needed
  ];
  
app.set('view engine', 'ejs');
app.use(session({
  name: 'session',
  secret: SECRET_KEY,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Create a 'public' folder for static files (e.g., CSS, images)

// MongoDB setup
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Define MongoDB schema and model for inventory items
const inventorySchema = new mongoose.Schema({
  name: String,
  description: String,
  quantity: Number,
  // Add other fields as needed
});

const InventoryItem = mongoose.model('InventoryItem', inventorySchema);

// Routes
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login', { message: '' }); // Pass an empty message or customize as needed
  });
  
  app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    // Check if the provided username and password match any user
    const authenticatedUser = usersInfo.find(user => user.username === username && user.password === password);
  
    if (authenticatedUser) {
      // Authentication successful, set session variables
      req.session.authenticated = true;
      req.session.username = authenticatedUser.username;
      res.redirect('/home');
    } else {
      // Authentication failed, display an error message
      res.render('login', { message: 'Invalid username or password' });
    }
  });
  
  
app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.get('/dashboard', (req, res) => {
  // Check if the user is authenticated
  if (!req.session.authenticated) {
    return res.redirect('/login');
  }

  // Implement dashboard logic (e.g., display user-specific information)
  res.render('dashboard', { userid: req.session.userid });
});

// CRUD operations
app.get('/inventory', async (req, res) => {
  // Retrieve all inventory items from the database
  try {
    const inventoryItems = await InventoryItem.find();
    res.render('inventory', { inventoryItems });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

app.get('/inventory/:id', async (req, res) => {
  // Retrieve a specific inventory item by ID
  const itemId = req.params.id;

  try {
    const inventoryItem = await InventoryItem.findById(itemId);
    res.render('inventory-details', { inventoryItem });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

app.post('/inventory', async (req, res) => {
  // Create a new inventory item
  const { name, description, quantity } = req.body;

  try {
    await InventoryItem.create({ name, description, quantity });
    res.redirect('/inventory');
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

app.put('/inventory/:id', async (req, res) => {
  // Update an existing inventory item by ID
  const itemId = req.params.id;
  const { name, description, quantity } = req.body;

  try {
    await InventoryItem.findByIdAndUpdate(itemId, { name, description, quantity });
    res.redirect(`/inventory/${itemId}`);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/inventory/:id', async (req, res) => {
  // Delete an inventory item by ID
  const itemId = req.params.id;

  try {
    await InventoryItem.findByIdAndDelete(itemId);
    res.redirect('/inventory');
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

// RESTful API
app.get('/api/inventory', async (req, res) => {
  try {
    const inventoryItems = await InventoryItem.find();
    res.json(inventoryItems);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/inventory', async (req, res) => {
  const { name, description, quantity } = req.body;

  try {
    const newItem = await InventoryItem.create({ name, description, quantity });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  const itemId = req.params.id;
  const { name, description, quantity } = req.body;

  try {
    const updatedItem = await InventoryItem.findByIdAndUpdate(itemId, { name, description, quantity }, { new: true });
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  const itemId = req.params.id;

  try {
    await InventoryItem.findByIdAndDelete(itemId);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/home', (req, res) => {
    // Check if the user is authenticated
    if (!req.session.authenticated) {
      return res.redirect('/login');
    }
  
    // Render the home page with user-specific information
    res.render('home', { username: req.session.username });
  });
  
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
