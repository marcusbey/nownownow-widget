// Simple HTTP server to serve the widget during development
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.js': 'application/javascript',
  '.map': 'application/json',
  '.html': 'text/html',
  '.css': 'text/css',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Parse the URL path
  let filePath = req.url;
  
  // Default to serving the widget.js file for the root path
  if (filePath === '/' || filePath === '') {
    filePath = '/now-widget.js';
  }
  
  // Map the URL path to the file in the dist directory
  filePath = path.join(DIST_DIR, filePath);
  
  // Check if the file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`File not found: ${filePath}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    
    // Determine the content type based on the file extension
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Read and serve the file
    fs.readFile(filePath, (err, content) => {
      if (err) {
        console.error(`Error reading file: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}/`);
  console.log(`Widget is available at http://localhost:${PORT}/now-widget.js`);
  console.log(`To test the widget, create an HTML file with this script tag:`);
  console.log(`<script src="http://localhost:${PORT}/now-widget.js" now-data-org-id="your-org-id" now-data-token="your-token"></script>`);
}); 