const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const axios = require('axios');
const { json } = bodyParser;
const app = express();
//const PORT = process.env.PORT || 5000;

// PostgreSQL connection configuration
const pool = new Pool({Your DB Details});

app.use(cors());
app.use(json());
app.use(express.json());

let callCount = 0;
let lastStoredData = {}; // Initialize lastStoredData as an empty object

// Function to fetch and store data
async function fetchDataAndStore(cityName) {
  try {
    if (callCount >= 1000) {
      console.log('API call limit exceeded for today');
      return;
    }
    callCount++;
    // Fetch data from the API
    console.log('City Name:', cityName);
    const url = `http://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&appid=YOUR_API`;
    const response = await axios.get(url);
    const newData = response.data;
    // Compare with the last stored data
    if (JSON.stringify(newData) === JSON.stringify(lastStoredData[cityName])) {
      console.log('Data unchanged for', cityName);
      return;
    }
    const insertData = `INSERT INTO TableName (city_name, data) VALUES ($1, $2)`;
    await pool.query(insertData, [cityName, newData]);
    console.log('Data stored successfully for', cityName);
    lastStoredData[cityName] = newData;
  } catch (error) {
    console.error('Error fetching and storing data:', error);
  }
}

// Schedule the task to run approximately every 86.4 seconds
setInterval(() => {
  fetchDataAndStore('Moscow');
  fetchDataAndStore('London');
  fetchDataAndStore('USA');
  fetchDataAndStore('Chennai');
}, 87 * 1000); 

app.get('/weather', async (req, res) => {
  try {
    const cityName = req.query.city; 
    const { rows } = await pool.query('SELECT * FROM TableName WHERE city_name = $1', [cityName]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Serve the React app's static files
app.use(express.static('/Your-File-Path'));

// Handle other routes by serving the React app's index.html
app.get('*', (req, res) => {
  res.sendFile('/Your-file-path/index.html');
});

app.use((req, res, next) => {
  console.log(`Received request for: ${req.method} ${req.url}`);
  next();
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
