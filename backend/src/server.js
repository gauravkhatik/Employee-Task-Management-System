import net from 'node:net';
import app from './app.js';
import connectDB from './config/db.js';

const DEFAULT_PORT = Number(process.env.PORT) || 5000;

const getAvailablePort = (port) =>
  new Promise((resolve, reject) => {
    const tester = net.createServer();

    tester.once('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        resolve(getAvailablePort(port + 1));
      } else {
        reject(error);
      }
    });

    tester.once('listening', () => {
      const address = tester.address();
      tester.close(() => resolve(address.port));
    });

    tester.listen(port);
  });

const startServer = async () => {
  try {
    await connectDB();
    const port = await getAvailablePort(DEFAULT_PORT);

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
