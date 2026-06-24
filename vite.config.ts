/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const apiServerPlugin = () => ({
  name: 'api-server-middleware',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const pathname = urlObj.pathname;
      
      if (pathname.startsWith('/api/')) {
        const apiName = pathname.replace('/api/', '');
        const filePath = join(process.cwd(), 'api', `${apiName}.js`);
        
        try {
          const fileUrl = pathToFileURL(filePath).href;
          const module = await import(fileUrl);

          // Parse query parameters
          const query: Record<string, string> = {};
          urlObj.searchParams.forEach((value, key) => {
            query[key] = value;
          });
          req.query = query;

          // Parse body if method is POST/PUT/DELETE
          if (['POST', 'PUT', 'DELETE'].includes(req.method || '')) {
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const bodyText = Buffer.concat(buffers).toString();
            try {
              req.body = JSON.parse(bodyText);
            } catch {
              req.body = bodyText;
            }
          }

          // Mock Vercel response helper functions
          res.status = (code: number) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data: any) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };

          // Call Vercel serverless function handler
          await module.default(req, res);
        } catch (err: any) {
          console.error(`Error in local API handler for ${pathname}:`, err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      } else {
        next();
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  // Load environment variables for the local Node process (including secrets like SUPABASE_SERVICE_ROLE_KEY)
  const allEnv = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, allEnv);

  const plugins = [react(), tailwindcss(), apiServerPlugin()];
  try {
    // @ts-expect-error - source tags file might not exist in all environments
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch {
    // ignore if source tags file is missing
  }

  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_']);
  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
  }

  return {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
  };
})
