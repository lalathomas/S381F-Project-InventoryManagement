const express = require('express');
const bodyParser = require('body-parser');
const session = require('cookie-session');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

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
}, { collection: 'inventoryItems' }); 


// Create a text index on the 'name' field
inventorySchema.index({ name: 'text' });

const InventoryItem = mongoose.model('InventoryItem', inventorySchema);
// CSRF setup
//app.use(cookieParser());
//const csrf = require('csurf');
//const csrfProtection = csrf({ cookie: true });
//app.use(csrfProtection);



app.set('view engine', 'ejs');
app.use(session({
  name: 'session',
  secret: SECRET_KEY,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/styles', express.static(path.join(__dirname, 'styles')));

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
//app.get('/inventory before
/*app.get('/inventory', async (req, res) => {
  if (!req.session.authenticated) {
    return res.redirect('/login');
  }

  try {
    const inventoryItems = await InventoryItem.find();
    console.log('Inventory Items:', inventoryItems); // Add this line for debugging
    res.render('inventory', { items: inventoryItems });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).send('Internal Server Error');
  }
});*/
app.get('/inventory', async (req, res) => {
  if (!req.session.authenticated) {
    return res.redirect('/login');
  }

  try {
    // Fetch regular inventory items
    const items = await InventoryItem.find();

    // Fetch search results (if a search query is provided)
    const query = req.query.q;
    let searchResults = [];
    if (query) {
      searchResults = await InventoryItem.find({ $text: { $search: query } });
    }

    console.log('Inventory Items:', items); // Add this line for debugging

    // Render HTML for the inventory page, including search results
    res.render('inventory', { items, searchResults, searchQuery: query });
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
app.get('/api/inventory/search', async (req, res) => {
  const query = req.query.q; // Retrieve the query parameter from the request

  try {
    // Use Mongoose or your database query to search for items based on the query parameter
    const searchResults = await InventoryItem.find({ $text: { $search: query } });

    // Return the search results as JSON
    res.json(searchResults);
  } catch (error) {
    console.error('Error searching inventory:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Delete an inventory item by ID
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


// Edit route
app.get('/inventory/:id/edit', async (req, res) => {
  if (!req.session.authenticated) {
    return res.redirect('/login');
  }

  const itemId = req.params.id;

  try {
    const inventoryItem = await InventoryItem.findById(itemId);
    if (!inventoryItem) {
      return res.status(404).send('Item not found');
    }

    res.render('edit', { inventoryItem });
  } catch (error) {
    console.error('Error rendering edit page:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.post('/inventory/:id/edit', async (req, res) => {
  // Extract the item ID from the request parameters
  const itemId = req.params.id;

  try {
    // Retrieve the existing inventory item by ID
    const existingItem = await InventoryItem.findById(itemId);

    if (!existingItem) {
      // If the item doesn't exist, return a 404 error
      return res.status(404).send('Item not found');
    }

    // Update the existing item with the data from the form
    existingItem.name = req.body.name;
    existingItem.description = req.body.description;
    existingItem.quantity = req.body.quantity;

    // Save the updated item to the database
    await existingItem.save();

    // Redirect to the inventory details page for the updated item
    res.redirect(`/inventory`);
  } catch (error) {
    // If an error occurs, return a 500 Internal Server Error
    console.error('Error updating inventory item:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


