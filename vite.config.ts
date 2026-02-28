import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const execAsync = promisify(exec);

const foundryStatusPlugin = {
  name: 'foundry-status-api',
  configureServer(server: any) {
    server.middlewares.use('/api/foundry-status', async (_req: any, res: any) => {
      try {
        const { stdout } = await execAsync('foundry service status');
        const match = stdout.match(/http:\/\/[\d.]+:\d+/);
        if (match) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ url: match[0] }));
        } else {
          res.statusCode = 503;
          res.end(JSON.stringify({ error: 'Service not running' }));
        }
      } catch {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to run foundry service status' }));
      }
    });
  }
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), foundryStatusPlugin],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
