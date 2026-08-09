import 'dotenv/config';
import express from 'express';
import { Client, GatewayIntentBits } from 'discord.js';

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

app.get('/api/status', (req, res) => res.json({ online: client.isReady(), guilds: client.guilds.cache.size, uptime: client.uptime }));
app.get('/api/guilds', (req, res) => res.json(client.guilds.cache.map(g => ({ id: g.id, name: g.name, icon: g.iconURL() }))));
app.get('/', (req, res) => res.type('html').send(`<!doctype html><html><head><title>Infinity Manager</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui;margin:40px;max-width:900px} .card{padding:20px;border:1px solid #ddd;border-radius:14px;margin:12px 0}h1{margin-bottom:4px}</style></head><body><h1>Infinity Manager</h1><p>Discord server management dashboard</p><div class="card" id="status">Loading...</div><div class="card"><h2>Servers</h2><ul id="guilds"></ul></div><script>Promise.all([fetch('/api/status').then(r=>r.json()),fetch('/api/guilds').then(r=>r.json())]).then(([s,g])=>{document.querySelector('#status').textContent='Online: '+s.online+' · Servers: '+s.guilds+' · Uptime: '+Math.round((s.uptime||0)/1000)+'s';document.querySelector('#guilds').innerHTML=g.map(x=>'<li>'+x.name+' ('+x.id+')</li>').join('')})</script></body></html>`));

client.once('ready', () => console.log(`Dashboard Discord client ready as ${client.user.tag}`));
client.login(process.env.DISCORD_TOKEN).catch(console.error);
app.listen(port, () => console.log(`🌐 Dashboard listening on port ${port}`));
