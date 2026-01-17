const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/linkedin_job_applier')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Socket.io for Logs
const AutomationService = require('./services/automation.service');

io.on('connection', (socket) => {
  console.log('Client connected to socket');

  // Send initial log
  socket.emit('log', '[System] Connected to log stream.');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Configure Automation Service to emit logs
AutomationService.setLogger((message) => {
  io.emit('log', `[Bot] ${message}`);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
