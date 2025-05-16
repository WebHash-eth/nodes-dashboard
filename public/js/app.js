// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
  // Get the globe container element
  const globeElement = document.getElementById('globeViz');
  
  // Initialize globe
  const world = Globe()
    .globeImageUrl('https://cdn.jsdelivr.net/npm/three-globe@2.24.10/example/img/earth-dark.jpg')
    .backgroundColor('#000')
    .hexPolygonResolution(3) // Lower resolution = larger hexagons (was 3)
    .hexPolygonMargin(0.3) // Increase margin to make hexagons more distinct
    .hexPolygonAltitude(0.005) // Lower base altitude for countries
    .hexPolygonCurvatureResolution(20)
    .hexPolygonsTransitionDuration(800)
    .width(globeElement.offsetWidth)
    .height(globeElement.offsetHeight)
    .showGlobe(true)
    .showAtmosphere(false); // Remove atmosphere glow
  
  // Helper function to format bytes to GB or TB
  function formatBytes(bytes, toUnit = 'GB') {
    if (bytes === 0) return '0 ' + toUnit;
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const unitIndex = sizes.indexOf(toUnit);
    
    if (unitIndex === -1) return bytes + ' Bytes';
    
    const value = bytes / Math.pow(k, unitIndex);
    return value.toFixed(2) + ' ' + toUnit;
  }
  
  // First, fetch country data
  fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
    .then(res => res.json())
    .then(countries => {
      // Add countries with a consistent color
      world
        .hexPolygonsData(countries.features)
        .hexPolygonColor(() => 'rgba(70, 70, 70, 0.6)') // Dark gray for countries
        (globeElement);
      
      // Center the globe view and zoom in more
      world.controls().autoRotate = true;
      world.controls().autoRotateSpeed = 0.5;
      world.pointOfView({ lat: 0, lng: 0, altitude: 1.5 }); // Lower altitude value for more zoom
      
      // Now fetch node data from our server which proxies to the external API
      return fetch('/api/nodes');
    })
    .then(res => res.json())
    .then(apiResponse => {
      // Extract the nodes data from the API response
      const nodesData = apiResponse.data;
      
      // Map the API data to the format needed for the globe
      const pointsData = nodesData.map(node => {
        // Format memory and storage for display
        const formattedMemory = typeof node.memory === 'number' ? formatBytes(node.memory) : node.memory;
        const formattedStorage = typeof node.storage === 'number' ? formatBytes(node.storage) : node.storage;
        
        return {
          lat: node.location.ll[0],
          lng: node.location.ll[1],
          size: 0.5, // Size of the point (larger value = bigger point)
          color: '#00FF66', // Bright green for nodes
          nodeId: node.id,
          hostname: node.hostname,
          memory: formattedMemory,
          uptime: node.uptime,
          storage: formattedStorage,
          cpuCount: node.cpuCount || 0,
          location: `${node.location.city}, ${node.location.country}`
        };
      });
      
      // Add points layer for nodes
      world
        .pointsData(pointsData)
        .pointAltitude(0.03) // Raise points above the hexagons
        .pointColor('color')
        .pointRadius('size')
        .pointsMerge(false) // Don't merge points for better interaction
        .pointLabel(point => {
          return `
            <div style="background-color: rgba(0, 0, 0, 0.8); padding: 10px; border-radius: 4px; position: relative; font-family: 'neue-machina', monospace; overflow: hidden;">
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 4px; border: 1px solid transparent; background: linear-gradient(to right, #fb923c, #ec4899) border-box; -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0); mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0); -webkit-mask-composite: source-out; mask-composite: exclude; pointer-events: none;"></div>
              <div style="position: relative; z-index: 1;">
                <div style="font-weight: 500; background: linear-gradient(to right, #fb923c, #ec4899); -webkit-background-clip: text; background-clip: text; color: transparent; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Node ${point.hostname}</div>
                <div style="margin: 4px 0;"><span style="color: #AAAAAA;">Location:</span> ${point.location}</div>
                <div style="margin: 4px 0;"><span style="color: #AAAAAA;">CPU:</span> ${point.cpuCount} cores</div>
                <div style="margin: 4px 0;"><span style="color: #AAAAAA;">Memory:</span> ${point.memory}</div>
                <div style="margin: 4px 0;"><span style="color: #AAAAAA;">Storage:</span> ${point.storage}</div>
                <!-- <div style="margin: 4px 0;"><span style="color: #AAAAAA;">Uptime:</span> ${point.uptime}</div> -->
              </div>
            </div>
          `;
        });
      
      // Add hover effect for points
      world.onPointHover(point => {
        document.body.style.cursor = point ? 'pointer' : 'default';
      });
      
      // Add click event for points
      world.onPointClick(point => {
        if (point) {
          alert(`Node Details:\nHostname: ${point.hostname}\nLocation: ${point.location}\nCPU: ${point.cpuCount} cores\nMemory: ${point.memory}\nStorage: ${point.storage}\nUptime: ${point.uptime}`);
        }
      });
      
      // Update node count
      document.getElementById('active-nodes').textContent = apiResponse.count;
      
      // Handle window resize
      window.addEventListener('resize', () => {
        world.width(globeElement.offsetWidth);
        world.height(globeElement.offsetHeight);
      });
    })
    .catch(error => {
      console.error('Error fetching node data:', error);
      alert('Failed to load node data. Please check if the API server is running.');
    });
  
  // Fetch stats data
  fetch('/api/stats')
    .then(res => res.json())
    .then(statsData => {
      // Update top row stats with new names
      document.getElementById('active-users').textContent = statsData.sitesHosted.toLocaleString();
      document.getElementById('active-nodes').textContent = statsData.activeNodes.toLocaleString();
      document.getElementById('machines-onboarded').textContent = statsData.storageConsumed.toLocaleString() + ' TB';
      
      // Update bottom row stats
      document.getElementById('total-cpus').textContent = statsData.totalCPUs.toLocaleString();
      document.getElementById('total-memory').textContent = `${statsData.totalMemory.toLocaleString()} TB`;
      document.getElementById('total-storage').textContent = `${statsData.totalStorage.toLocaleString()} TB`;
    })
    .catch(error => {
      console.error('Error fetching stats data:', error);
    });
});
