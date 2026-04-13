const https = require('https');

const appId = '1086341595318833757';
const affiliateId = '0a1021a6.799124d3.0a1021a7.ae1e5f5e';
const keyword = 'test';

const url = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?applicationId=${appId}&affiliateId=${affiliateId}&keyword=${keyword}&hits=1`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
