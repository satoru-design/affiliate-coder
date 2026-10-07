This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 環境変数

このアプリはパスワード認証で保護されている。起動前に `.env.example` をもとに
`.env.local` を作り、4つの変数を設定する。

| 変数 | 用途 | 条件 |
|---|---|---|
| `RAKUTEN_APP_ID` | 楽天ウェブサービスの applicationId | 必須 |
| `RAKUTEN_AFFILIATE_ID` | 楽天のアフィリエイトID | 必須 |
| `APP_PASSWORD` | ログインパスワード | 12文字以上 |
| `SESSION_SECRET` | セッション Cookie の署名鍵 | 32文字以上 |

`SESSION_SECRET` は `openssl rand -base64 32` で生成する。

`APP_PASSWORD` と `SESSION_SECRET` が条件を満たさない場合、ログインは常に失敗する。
設定漏れで認証が無効化されるのを避けるため、意図的にこの挙動にしている。

Vercel にデプロイする場合は、同じ4つを Environment Variables に登録する。
`SESSION_SECRET` を変更すると、既存のログインセッションはすべて無効になる。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
