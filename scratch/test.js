const https = require('https');

// 資格情報はコードに書かず環境変数から読む。
// 例: RAKUTEN_APP_ID=xxx RAKUTEN_AFFILIATE_ID=yyy node scratch/test.js
const appId = process.env.RAKUTEN_APP_ID;
const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;
const keyword = process.env.RAKUTEN_TEST_KEYWORD || 'test';

if (!appId || !affiliateId) {
  console.error('RAKUTEN_APP_ID と RAKUTEN_AFFILIATE_ID を環境変数で指定してください。');
  process.exit(1);
}

const params = new URLSearchParams({
  applicationId: appId,
  affiliateId: affiliateId,
  keyword: keyword,
  hits: '1',
});

const url = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?${params.toString()}`;

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
