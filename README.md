## Rule

https://de.wikipedia.org/wiki/Kuhhandel_(Spiel)

## Setup

```bash
docker compose up -d
cp .env.example .env
npm install
npm run migrate
npm run seed
npm run dev

# another terminal
npm run ws-server
```

## テスト

場合によっては `npx playwright install` が必要なことがある。
事前に `docker compose up -d` でDBを起動する必要がある。(直にDBに接続して reset や fixture を流したりする)

```bash
npm run test
```
