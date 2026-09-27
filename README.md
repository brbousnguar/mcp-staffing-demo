# mcp-staffing-demo

*[Français](README.fr.md)*

A small, self-contained **MCP server** used as the live demo of the talk
[« MCP : donner des mains à vos agents »](https://heybrahim.com/talks/mcp/fr/) ([English](https://heybrahim.com/talks/mcp/)).
The domain is deliberately familiar: staffing at a consulting firm. Four tools, one in-memory dataset, no network calls and
no database, because a demo on a conference stage shouldn't depend on anything.

Tool names and data are in French, as in the talk. Everything is fictional.

## Quick start

```bash
git clone https://github.com/brbousnguar/mcp-staffing-demo
cd mcp-staffing-demo
npm install && npm run build
```

## Connecting

**Claude Code**

```bash
claude mcp add staffing -- node "$PWD/dist/index.js"
```

**Claude Desktop, Cursor, or any client that reads an `mcpServers` config** (for VS Code + Copilot, put the same block in `.vscode/mcp.json`):

```json
{
  "mcpServers": {
    "staffing": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-staffing-demo/dist/index.js"]
    }
  }
}
```

Then ask your agent something like: *"Can we staff the insurer's mission starting in November, and with whom?"*

## The tools

| Tool | Input | Output |
|---|---|---|
| `rechercher_collaborateurs` | `competence?`, `niveau_min?`, `agence?`, `mois?`, `jours_min?`, `limite` | A short list, sorted by level then availability |
| `obtenir_collaborateur` | `id` | One person's profile: rated skills, day rate, languages, monthly load |
| `analyser_staffing_mission` | `mission_id`, `candidats_max` | A coverage verdict plus scored candidates, with typed `structuredContent` |
| `reserver_collaborateur` | `collaborateur_id`, `mission_id`, `mois`, `jours` | A booking confirmation, or an explicit error |

## What the code demonstrates

Each tool exists to make one point from the talk:

- **`z.strictObject` everywhere.** A parameter the model invents is rejected with `Unrecognized key: "…"` instead of being
  silently ignored — the bug from lesson 1 of the talk.
- **The computation lives in the server.** `analyser_staffing_mission` crosses skills, load and budget in tested
  TypeScript. The model gets a verdict, not tables to reconcile.
- **Two outputs per call.** `content` carries the answer the model reads; `structuredContent` the same result as typed
  JSON for orchestrating code.
- **No empty success.** `reserver_collaborateur` fails loudly if the person is unknown or out of capacity. An agent can
  never believe it wrote something it didn't.

## Scripts

| Command | Does |
|---|---|
| `npm run build` | Compile `src/` to `dist/` |
| `npm run dev` | Compile on change |
| `npm run check` | Type-check only |
| `npm start` | Run the server on stdio |

## The dataset

`src/donnees.ts`: 8 people, 3 missions, a capacity of 20 working days a month, four open months (`2026-09` to
`2026-12`). All fictional. Bookings made during a session live in memory and disappear on restart.

## Stack

TypeScript 5.9 · `@modelcontextprotocol/server` 2.0 · Zod 4 · stdio transport · Node ≥ 20

> **Mind the SDK version.** This server uses SDK **v2** (`@modelcontextprotocol/server`, `zod/v4`, `inputSchema` as a
> `z.strictObject({…})`). Most tutorials still use SDK **v1** (`@modelcontextprotocol/sdk`), whose import paths and
> `inputSchema` shape (a raw shape rather than a Zod object) differ. Copying this code into a v1 project won't work as is.

## License

MIT
