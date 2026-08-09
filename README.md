# Infinity Manager 🤖

Infinity Manager is an all-in-one Discord management bot for moderation, AutoMod, security, logging, tickets, roles, welcome systems, AI assistance, persistence, and a web dashboard.

## Features

### 🛡️ Moderation
`/ban` · `/kick` · `/timeout` · `/warn` · `/warnings` · `/clearwarns` · `/clear`

### 🤖 AutoMod
Spam detection, invite blocking, optional URL blocking, mention limits, blocked words, message deletion, and automatic timeouts.

### 🔒 Security
Anti-raid join detection, anti-nuke destructive-action detection, automatic lockdown, and security configuration.

### 👋 Community
Welcome messages, goodbye messages, customizable placeholders, and automatic member roles.

### 📋 Logging
Member joins/leaves, message deletion/editing, bans/unbans, channels, and roles.

### 🎫 Tickets
Private support ticket creation and closing.

### 🎭 Roles
Create/delete roles and add/remove roles from members with hierarchy protection.

### 🧠 AI
Optional `/ask` Discord assistant using the OpenAI API.

### 💾 Database
Optional PostgreSQL layer for server settings and future persistent configuration.

### 🌐 Dashboard
A lightweight Express dashboard foundation with bot status and guild information.

## Setup

1. Install Node.js 20+.
2. Clone the repository.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Add `DISCORD_TOKEN` and `CLIENT_ID`.
6. Add `GUILD_ID` while developing to register commands instantly in a test server.
7. Optionally configure PostgreSQL with `DATABASE_URL`.
8. Optionally configure AI with `OPENAI_API_KEY`.
9. Run `npm start`.
10. Run `npm run dashboard` for the web dashboard.

## Discord permissions/intents

Enable **Server Members Intent** and **Message Content Intent** in the Discord Developer Portal. Give the bot the permissions required by the modules you enable, including Manage Messages, Moderate Members, Manage Roles, Manage Channels, View Audit Log, and other moderation permissions.

## Environment

See `.env.example` for all supported variables.

**Never commit `.env` or expose your Discord bot token.**

## Roadmap

- Persistent configuration wiring for every module
- Full Discord OAuth2 dashboard authentication
- Dashboard configuration controls
- Music/voice module
- Automated tests and CI
- Railway deployment configuration
