const express = require('express');
const bodyParser = require('body-parser');
const session = require('cookie-session');
const mongoose = require('mongoose');
const csrf = require('csurf');
const ObjectId = mongoose.Types.ObjectId;
const SECRET_KEY = 'your-secret-key';
const app = express();
const PORT = process.env.PORT || 3000;
const usersInfo = [
  { username: "user1", password: "password1" },
  { username: "user2", password: "password2" },
  { username: "lala", password: "lala" },
  // Add more users as needed
];
// MongoDB setup
const MONGODB_URI = 'mongodb+srv://thomaslaw:lala1120@cluster0.rreryim.mongodb.net/inventoryDB?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define MongoDB schema and model for inventory items
const inventorySchema = new mongoose.Schema({
  name: String,
  description: String,
  quantity: Number,
}, { collection: 'inventoryItems' }); // Specify the collection name here

const InventoryItem = mongoose.model('InventoryItem', inventorySchema);

// CSRF setup
const csrfProtection = csrf({ cookie: true });

app.set('view engine', 'ejs');
app.use(session({
  name: 'session',
  secret: SECRET_KEY,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

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

app.get('/dashboard', async (req, res) => {
  // Check if the user is authenticated
  if (!req.session.authenticated) {
    return res.redirect('/login');
  }

  try {
    // Fetch user-specific information from the database
    const userInventoryItems = await InventoryItem.find({/* Add a condition to filter items if needed */});

    // Render the dashboard with user-specific information
    res.render('dashboard', { 
      username: req.session.username, // Change userid to username
      userInventoryItems: userInventoryItems,
    });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});


// CRUD operations

app.get('/inventory', async (req, res) => {
  try {
    const inventoryItems = await InventoryItem.find();
    console.log('Inventory Items:', inventoryItems); // Add this line for debugging
    res.render('inventory', { items: inventoryItems });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
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
  
  app.get('/create', (req, res) => {
    // Check if the user is authenticated
    if (!req.session.authenticated) {
      return res.redirect('/login');
    }
  
    // Render the create page
    res.render('create');
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
  // server.js

// Add a route for handling the editing form submission
app.post('/inventory/:id/edit', async (req, res) => {
  // Check if the user is authenticated
  if (!req.session.authenticated) {
    return res.redirect('/login');
  }

  const itemId = req.params.id;
  const { name, description, quantity } = req.body;

  try {
    const inventoryItem = await InventoryItem.findById(itemId);
    if (!inventoryItem) {
      return res.status(404).send('Item not found');
    }

    // Update the inventory item
    inventoryItem.name = name;
    inventoryItem.description = description;
    inventoryItem.quantity = quantity;

    await inventoryItem.save();

    // Redirect to the inventory list
    res.redirect('/inventory');
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});
// Edit route
app.get('/inventory/:id/edit', csrfProtection, async (req, res) => {
  if (!req.session.authenticated) {
    return res.redirect('/login');
  }

  const itemId = req.params.id;

  try {
    const inventoryItem = await InventoryItem.findById(itemId);
    if (!inventoryItem) {
      return res.status(404).send('Item not found');
    }

    // Pass csrfToken to the view
    res.render('edit', { inventoryItem, csrfToken: req.csrfToken() });
  } catch (error) {
    console.error('Error rendering edit page:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
