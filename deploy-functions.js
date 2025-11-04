const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'lputifqvrradmfedheov';

const functions = [
  'upload-document-backend',
  'process-document-backend',
  'get-extracted-data-backend'
];

async function deployFunction(functionName) {
  const functionPath = path.join(__dirname, 'supabase', 'functions', functionName, 'index.ts');
  const code = fs.readFileSync(functionPath, 'utf8');
  
  // Read shared CORS file if it exists
  const corsPath = path.join(__dirname, 'supabase', 'functions', '_shared', 'cors.ts');
  let corsCode = '';
  if (fs.existsSync(corsPath)) {
    corsCode = fs.readFileSync(corsPath, 'utf8');
  }

  const payload = JSON.stringify({
    slug: functionName,
    name: functionName,
    verify_jwt: true,
    import_map: false,
    entrypoint_path: 'index.ts',
    code: code
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/functions`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ ${functionName} deployed successfully`);
          resolve(JSON.parse(data));
        } else {
          console.error(`❌ Failed to deploy ${functionName}: ${data}`);
          reject(new Error(data));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Error deploying ${functionName}:`, error);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  if (!SUPABASE_ACCESS_TOKEN) {
    console.error('❌ SUPABASE_ACCESS_TOKEN not found in .env.local');
    process.exit(1);
  }

  console.log('🚀 Starting deployment of Edge Functions...\n');

  for (const functionName of functions) {
    try {
      await deployFunction(functionName);
    } catch (error) {
      console.error(`Failed to deploy ${functionName}:`, error.message);
    }
  }

  console.log('\n✅ Deployment complete!');
}

main();
