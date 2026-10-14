import app from './app.js';
import connectDB from './config/db.js';

const startServer = async () => {
  try {
    await connectDB();
    const port = Number(process.env.PORT) || 5001;

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
