# GMG Password Sprint

Run locally or on any Node host (Render, Railway, a VPS, etc.):

    ADMIN_PIN=yourpin node server.js

Open http://localhost:3000. Needs Node 16+, no installs.
- ADMIN_PIN: PIN for the Admin reset button (default 1234, change it).
- PORT: default 3000. DATA_DIR: where data.json (scores) is saved, use a persistent disk in production.
Put it behind HTTPS on your own domain (e.g. typing.gmg.com) through your host or a reverse proxy.
