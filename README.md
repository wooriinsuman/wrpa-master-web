# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## 배포 / 인프라

CI/CD·인프라 문서는 master-v2 레포의 [`docs/setup/infra-runbook.md`](https://github.com/wooriinsuman/wrpa-master-v2/blob/main/docs/setup/infra-runbook.md) 를 참조하세요. 이 레포는 `ci`(PR·main), `release`(tag `v*` → registry:2), `deploy`(수동 dispatch) 워크플로를 가집니다.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
