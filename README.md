# Node Dashboard with 3D Globe Visualization

A simple dashboard that visualizes nodes on a 3D globe based on IP addresses, along with various statistics.

## Features

- 3D globe visualization of nodes using hexed polygons
- Real-time statistics display
- Interactive globe with hover effects
- Toggle globe rotation
- Toggle node labels

## Preview

The dashboard displays:
- Total number of nodes
- Total number of CPUs
- Total memory
- Total storage
- Total number of sites hosted
- Total storage consumed

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

## Usage

1. Start the server:

```bash
npm start
```

2. Open your browser and navigate to `http://localhost:3000`

## Data Structure

The application uses two main JSON files for data:

1. `data/nodes.json` - Contains information about each node including IP address, geographical location, and resource information
2. `data/stats.json` - Contains aggregate statistics about the network

## Technologies Used

- Node.js and Express for the backend
- [Globe.gl](https://github.com/vasturiano/globe.gl) for the 3D globe visualization
- Three.js for 3D rendering
- D3.js for data manipulation

## Customization

You can customize the dashboard by:
- Modifying the `nodes.json` file to add more nodes
- Updating the `stats.json` file to reflect your actual statistics
- Adjusting the globe appearance in `app.js`
- Modifying the CSS in `style.css` to change the dashboard appearance

## License

MIT
