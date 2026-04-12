const fs = require('fs');

const env = `export const environment = {
  production: true,
  supabase: {
    url: '${process.env.SUPABASE_URL}',
    key: '${process.env.SUPABASE_ANON_KEY}'
  }
};
`;

fs.writeFileSync('src/environments/environment.prod.ts', env);
console.log('environment.prod.ts created');