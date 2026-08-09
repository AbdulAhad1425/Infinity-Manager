# Infinity Manager 🤖

Infinity Manager is an all-in-one Discord management bot designed to handle moderation, automation, security, logging, tickets, roles, and server management.

## Current features

- `/ping` — Check bot latency
- `/serverinfo` — Show server information
- `/userinfo` — Show user information
- `/botinfo` — Show bot information
- `/help` — Show available commands

## Setup

1. Install Node.js 20 or newer.
2. Clone this repository.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Add your Discord bot token, application client ID, and optional test guild ID.
6. Run `npm start`.

## Environment variables

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id
GUILD_ID=your_test_server_id
```

Never commit your real `.env` file or bot token.

## Roadmap

- Moderation
- AutoMod
- Anti-raid and anti-nuke protection
- Welcome and goodbye system
- Advanced logging
- Tickets
- Role management
- Server configuration
- PostgreSQL database
- AI assistant
- Web dashboard
- Railway deployment
