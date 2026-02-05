# Note It

Sticky notes app built with React + Vite on the client and Node.js + Express + Prisma on the backend. It stores data in SQLite and can run both in local development mode and inside Docker containers.

## Main stack
- **Client:** React, Vite, Tailwind CSS.
- **Server:** Node.js, Express, Prisma, SQLite.
- **Infra:** Docker/Docker Compose with a persistent volume for the database.

## Local development
You can work with plain npm commands:

```bash
# Client
cd client
npm install
npm run dev

# Server
cd server
npm install
npm run dev
```

There is also a Docker workflow that mirrors the production stack but rebuilds images from your local code:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

This builds the frontend with the `CLIENT_BUILD_API_URL` (defaults to `http://localhost:4000/api`), spins up the API on `http://localhost:4000`, and serves the client on `http://localhost:4173`.

## Environment files and variables
Use the included templates to understand which values must be set before deploying:

- `client/.env.example` and `server/.env.example`: variables consumed when running each app via npm.
- `.env`: template with global Docker Compose configuration (images, ports, volume, URLs, etc.). It is safe to version because it contains no real secrets.
- `.env.production`: optional template with the values the server needs specifically. You can reuse it with `docker compose --env-file .env.production up` on any host.

If someone wants to rely on **only the `docker-compose.yml`** (e.g., in Portainer), they can paste the YAML and fill in the variables in the stack’s “Env vars” section. The compose file uses `${VAR:-value}` everywhere, so the same values can also come from `--env-file` or exported shell variables.

### Global variables (docker-compose)
| Variable | Description | Required? | Default |
| --- | --- | --- | --- |
| `COMPOSE_PROJECT_NAME` | Logical Docker/Portainer stack name. | No | `note-it` |
| `SERVER_IMAGE` | Published API image (`user/note-it-server:tag`). | Yes | `note-it-server:latest` (placeholder) |
| `CLIENT_IMAGE` | Published frontend image (`user/note-it-client:tag`). | Yes | `note-it-client:latest` (placeholder) |
| `SERVER_PORT` | Host port that exposes the API. | No | `4000` |
| `CLIENT_PORT` | Host port for the static client. | No | `4173` |
| `SERVER_DATA_VOLUME` | Docker volume name that persists `/data/app.db`. | No | `noteit-data` |
| `DATABASE_URL` | Path to the SQLite file inside the container. | No | `file:/data/app.db` |
| `CLIENT_URLS` | Comma-separated list of origins allowed by CORS. Point it to the real public frontend URLs. | Yes | `http://localhost:4173` |
| `JWT_SECRET` | Secret used to sign JWTs. Change it in production. | Yes | `change-this-secret` (placeholder) |

### Build/development-specific variables
| Variable | Where it is used | Required? | Default |
| --- | --- | --- | --- |
| `CLIENT_BUILD_API_URL` | Vite build arg so the frontend hits the right API when built through `docker-compose.dev.yml`. | No | `http://localhost:4000/api` |

> Feel free to copy `.env` and `.env.production` as-is into Portainer or your deployment host and edit the values there before launching.

## Deploying using only the YAML
1. **Grab the `docker-compose.yml`** (from this repo or your docs).
2. **Provide the variables** from the table above:
   - In Portainer, open the “Environment variables” section and add each `NAME=value` pair.
   - With the CLI, create an `.env` file or export them directly before running `docker compose up -d`.
3. **Start the stack.** Docker automatically creates the named volume (`SERVER_DATA_VOLUME`) and runs the API + client with the images you specify.
4. **Verify** that the frontend responds on the configured port and that `curl http://YOUR_HOST:4000/api/health` returns `ok`.

No clone or extra files are required: the compose file already carries the defaults and only needs you to fill the required variables.

## Image build and publish
1. Update `SERVER_IMAGE`, `CLIENT_IMAGE`, and `CLIENT_BUILD_API_URL` (if the frontend must call another API URL) in your envs.
2. Authenticate with your registry (`docker login`).
3. Build both images using the dev overlay so they pick your latest source code:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml build
```

4. (Optional) Test the resulting stack locally:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

5. Push the images to your registry:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml push
```

The frontend build uses the `VITE_API_URL` argument. If your API won’t live at `http://localhost:4000/api`, export `CLIENT_BUILD_API_URL="https://your-domain/api"` before running `build`.

## Production / Portainer deployment
1. Publish your images (see previous section) or point `SERVER_IMAGE` / `CLIENT_IMAGE` to tags that are reachable from the target host.
2. Define the variables described earlier (reuse the `.env` templates or set them manually in Portainer/CLI).
3. Import `docker-compose.yml` into Portainer (or run `docker compose up -d` on the target machine). If you use Portainer, add the `VARIABLE=value` pairs before launching the stack.
4. The named volume `noteit-data` (controlled by `SERVER_DATA_VOLUME`) is created automatically and persists `app.db`. Change the variable if you prefer another volume or mount a host path.
5. Verify the deployment at `http://YOUR_HOST:4173` and check the API health via `curl http://YOUR_HOST:4000/api/health`.

The only mandatory artifact is the `docker-compose.yml`. Everything else (env templates, scripts) simply helps fill in those variables faster.

## Handy scripts
- `docker compose up -d` → production-style deployment using published images.
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v` → clean up local dev containers/volumes.
- `curl http://localhost:4000/api/health` → quick API health check.
