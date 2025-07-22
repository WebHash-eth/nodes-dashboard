const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes - Proxy to external API
app.get('/api/nodes', async (req, res) => {
  try {
    // Forward the request to the external API
    const response = await axios.get('http://localhost:3003/api/nodes');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching nodes data from external API:', error.message);
    res.status(500).json({ error: 'Failed to fetch nodes data from external API' });
  }
});

// API Route for stats - Calculate from nodes data
app.get('/api/stats', async (req, res) => {
  try {
    // Get nodes data from the external API
    const response = await axios.get('http://localhost:3003/api/nodes');
    const nodesData = response.data.data;
    
    // Calculate stats from nodes data
    let totalCPUs = 0;
    let totalMemoryBytes = 0;
    let totalStorageBytes = 0;
    
    nodesData.forEach(node => {
      // Sum up CPU count from all nodes
      totalCPUs += node.cpuCount || 0;
      
      // Sum memory bytes
      if (typeof node.memory === 'number') {
        totalMemoryBytes += node.memory;
      }
      
      // Sum storage bytes
      if (typeof node.storage === 'number') {
        totalStorageBytes += node.storage;
      }
    });
    
    // Convert bytes to TB (1 TB = 1000^4 bytes) - Using decimal TB (1 trillion bytes)
    const bytesToTB = 1000 * 1000 * 1000 * 1000; // 1 trillion bytes = 1 TB
    const totalMemoryTB = totalMemoryBytes / bytesToTB;
    const totalStorageTB = totalStorageBytes / bytesToTB;
    
    // Round to 2 decimal places
    const roundedMemoryTB = Math.round(totalMemoryTB * 100) / 100;
    const roundedStorageTB = Math.round(totalStorageTB * 100) / 100;
    
    // Static values as requested
    const sitesHosted = 12226;
    const storageConsumedTB = 1.2; // 450 GB converted to TB
    
    console.log('Stats calculation:', {
      totalCPUs,
      totalMemoryBytes,
      totalStorageBytes,
      totalMemoryTB,
      totalStorageTB,
      roundedMemoryTB,
      roundedStorageTB
    });
    
    // Create stats object
    const statsData = {
      totalCPUs: totalCPUs,
      totalMemory: roundedMemoryTB,
      totalStorage: roundedStorageTB,
      sitesHosted: sitesHosted,
      storageConsumed: storageConsumedTB,
      activeNodes: response.data.count
    };
    
    res.json(statsData);
  } catch (error) {
    console.error('Error calculating stats from API data:', error.message);
    res.status(500).json({ error: 'Failed to calculate stats' });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
