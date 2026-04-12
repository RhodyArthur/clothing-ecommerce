const fs = require('fs');

const env = `export const environment = {
  production: true,
  whatsappNumber: '${process.env.WHATSAPP_NUMBER}',
  supabase: {
    url: '${process.env.SUPABASE_URL}',
    key: '${process.env.SUPABASE_ANON_KEY}'
  }
};
`;

fs.mkdirSync('src/environments', { recursive: true });
fs.writeFileSync('src/environments/environment.ts', env);
console.log('environment.ts created');