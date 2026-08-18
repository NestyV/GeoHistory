const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const appDir = path.join(cwd, 'app');
const backendDir = path.join(cwd, 'backend');

if (!fs.existsSync(appDir) || !fs.existsSync(backendDir)) {
  console.error('Error: run npm commands from project root (GeoHistory), not from backend/.');
  process.exit(1);
}
