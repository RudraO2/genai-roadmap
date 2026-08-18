# AI Tooling Seeds — Online / Plugin-First Roadmap Candidates

Focus: browser tools, one-command plugins, MCP servers, and agent skills.  
No local GPU, no ComfyUI, no self-hosted models, no heavy installs.

---

### ChatGPT (web)
- what: Browser chat that can write code, make images, and talk through ideas
- why_fun: Type “make me a simple game” and get something playable in minutes
- tier: ground
- tracks: all
- prereq: none
- links: https://chatgpt.com
- discourse: Default starting point for almost everyone

### Claude (web / claude.ai)
- what: Browser chat strong at long context, code, and careful reasoning
- why_fun: Paste a messy idea and get clean structure or a working prototype outline
- tier: ground
- tracks: all
- prereq: none
- links: https://claude.ai
- discourse: Heavy daily use among builders on X

### Gemini (web / app)
- what: Google’s browser AI with image, video, and search baked in
- why_fun: Free image and short video experiments without signing up for extra tools
- tier: ground
- tracks: media, portfolio
- prereq: none
- links: https://gemini.google.com
- discourse: Common free creative entry point in 2026

### What an API key is (and where it goes)
- what: Secret string that lets a website or plugin talk to an AI service for you
- why_fun: Unlocks extra models or tools inside the apps you already use
- tier: ground
- tracks: all
- prereq: none
- links: UNVERIFIED common knowledge
- discourse: First real “power user” step for most people

### What a skill is (for coding agents)
- what: Tiny add-on that teaches Claude Code / Cursor how to do one specific job
- why_fun: One command and your agent suddenly knows video, design, or testing patterns
- tier: ground
- tracks: app, media, portfolio
- prereq: none
- links: UNVERIFIED common agent practice
- discourse: Daily talk around Claude Code and Cursor

### What an MCP server is
- what: Plug-in that gives your AI agent live access to GitHub, search, Notion, etc.
- why_fun: Agent can open real tools instead of only talking about them
- tier: ground
- tracks: app, portfolio
- prereq: Claude Code or Cursor
- links: https://modelcontextprotocol.io
- discourse: Core infrastructure conversation since late 2025

### How to add an MCP server (one-liner style)
- what: Usually just paste a short JSON snippet or run `npx …` once
- why_fun: New superpower appears in your agent without installing software
- tier: ground
- tracks: app
- prereq: What an MCP server is
- links: UNVERIFIED Cursor / Claude Code docs
- discourse: Most common setup question on X

### How to install a skill (`npx skills add …`)
- what: One terminal command that teaches your agent a new workflow
- why_fun: HyperFrames, Remotion, testing patterns, etc. appear as slash commands
- tier: ground
- tracks: app, media
- prereq: Claude Code or Cursor
- links: UNVERIFIED skills ecosystem
- discourse: Standard install pattern in 2026 agent threads

### Vercel (free deploy)
- what: Push a project and get a live public link in under a minute
- why_fun: Show a friend the thing you just made without any server knowledge
- tier: ground
- tracks: app, portfolio, game
- prereq: none
- links: https://vercel.com
- discourse: Default free hosting for beginners

### Netlify / Cloudflare Pages
- what: Same idea as Vercel — free static/site hosting with a public URL
- why_fun: Instant shareable demo of any small site or game
- tier: ground
- tracks: app, portfolio
- prereq: none
- links: https://www.netlify.com
- discourse: Parallel free-deploy options

### Reading a README the useful way
- what: Look for the “Quick start” or “Install” section and run the commands as written
- why_fun: Turns a mysterious GitHub page into a working tool in a few minutes
- tier: ground
- tracks: all
- prereq: none
- links: UNVERIFIED common practice
- discourse: Still the biggest beginner blocker

### Tokens & why chats get expensive or forgetful
- what: Models count text in small pieces; long chats cost more and lose early context
- why_fun: Explains why short clear prompts work better and cost less
- tier: intuition
- tracks: all
- prereq: none
- links: https://platform.openai.com/tokenizer
- discourse: Everyday cost talk

### Context window (why the AI “forgets”)
- what: Fixed amount of text the model can see at once
- why_fun: Stops the mystery of sudden amnesia mid-project
- tier: intuition
- tracks: all
- prereq: Tokens
- links: UNVERIFIED common explanation
- discourse: Constant pain point in agent use

### Why models make things up
- what: They predict likely words, not verified facts
- why_fun: You stop trusting every confident answer and start checking
- tier: intuition
- tracks: all
- prereq: none
- links: UNVERIFIED common intuition
- discourse: Core mental model

### Temperature / creativity slider
- what: Makes the AI more random and inventive or more focused and safe
- why_fun: Same prompt can give wild art or clean code depending on the dial
- tier: intuition
- tracks: all
- prereq: none
- links: UNVERIFIED common parameter
- discourse: Prompting basics

### Model vs chat UI vs agent
- what: Model = brain; chat = conversation window; agent = brain + tools + loop
- why_fun: Know when you’re just chatting versus when the AI can actually act
- tier: intuition
- tracks: all
- prereq: none
- links: UNVERIFIED community consensus
- discourse: Clarifying language used daily

### Prompting that actually works
- what: Clear goal + constraints + one good example beats long vague wishes
- why_fun: First drafts of sites, games, and videos appear instead of generic fluff
- tier: core
- tracks: all
- prereq: none
- links: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview
- discourse: Evergreen best practice

### Claude Code (web + desktop + VS Code)
- what: Anthropic’s coding agent that plans, edits files, and runs commands
- why_fun: Describe a feature and watch a working version appear
- tier: core
- tracks: app, game, portfolio
- prereq: none
- links: https://claude.ai/code
- discourse: Dominant agent discussion on X in 2026

### Cursor
- what: Editor built around agents; works in the browser-ish and desktop
- why_fun: Stay in one place while the AI rewrites multiple files
- tier: core
- tracks: app, game, portfolio
- prereq: none
- links: https://cursor.com
- discourse: Still one of the two most-used coding tools

### GitHub Copilot (in VS Code / GitHub)
- what: AI that lives inside GitHub and VS Code, including agent modes
- why_fun: Ask for a feature and get a pull request without leaving GitHub
- tier: core
- tracks: app, portfolio
- prereq: none
- links: https://github.com/features/copilot
- discourse: Ubiquitous, especially for people already on GitHub

### MCP — GitHub server
- what: Lets your agent open issues, read PRs, and search code on GitHub
- why_fun: Agent can manage the real repo instead of only talking about it
- tier: core
- tracks: app, portfolio
- prereq: What an MCP server is
- links: UNVERIFIED @modelcontextprotocol/server-github
- discourse: Most recommended first MCP server

### MCP — Context7
- what: Gives the agent up-to-date docs for libraries instead of old training data
- why_fun: Stops the agent writing Next.js 13 code when you’re on 15
- tier: core
- tracks: app
- prereq: What an MCP server is
- links: UNVERIFIED @upstash/context7-mcp
- discourse: Frequently listed as must-have in 2026 guides

### MCP — Brave Search / web search
- what: Lets the agent look things up on the live web
- why_fun: Agent can check current docs or news without you pasting links
- tier: core
- tracks: all
- prereq: What an MCP server is
- links: UNVERIFIED @modelcontextprotocol/server-brave-search
- discourse: Standard research MCP

### CLAUDE.md / project instruction file
- what: One markdown file that tells the agent how this project works
- why_fun: Every new chat remembers your style and rules automatically
- tier: core
- tracks: app, portfolio
- prereq: Claude Code
- links: UNVERIFIED common practice
- discourse: Constant advice on X

### Cursor rules / .cursorrules
- what: Same idea as CLAUDE.md but for Cursor
- why_fun: Agent stays consistent with your project conventions
- tier: core
- tracks: app, portfolio
- prereq: Cursor
- links: UNVERIFIED common practice
- discourse: Parallel to CLAUDE.md talk

### HyperFrames + skills
- what: Turn plain HTML into video; agents write the HTML, CLI or cloud renders it
- why_fun: Describe a motion graphic and get a real MP4 without learning After Effects
- tier: core
- tracks: media, portfolio
- prereq: Claude Code or Cursor + skill install
- links: https://github.com/heygen-com/hyperframes
- discourse: Actively used with Claude Code for video editing on X

### Remotion + agent skills
- what: Make videos with React code; agents write the components for you
- why_fun: Programmatic explainers, social clips, and data videos from a prompt
- tier: core
- tracks: media, portfolio
- prereq: Claude Code or Cursor + skill install
- links: https://www.remotion.dev
- discourse: Steady “code-as-video” path, now with official skills

### Ideogram (web)
- what: Browser image tool especially good at readable text inside pictures
- why_fun: Logos, posters, and UI mockups that actually have legible words
- tier: core
- tracks: media, portfolio
- prereq: none
- links: https://ideogram.ai
- discourse: Go-to for text-in-image needs

### Leonardo AI (web)
- what: Browser image platform with free daily credits and strong models
- why_fun: High-quality images without any local setup
- tier: core
- tracks: media, portfolio
- prereq: none
- links: https://leonardo.ai
- discourse: Frequently recommended free-tier option

### Kling (web)
- what: Browser image-to-video and text-to-video, strong with people and motion
- why_fun: Animate a photo into a short believable clip in the browser
- tier: core
- tracks: media
- prereq: none
- links: https://kling.ai
- discourse: Regularly compared with Runway and Veo

### Runway (web)
- what: Browser AI video workspace with generation and light editing
- why_fun: Turn text or images into short cinematic clips online
- tier: core
- tracks: media
- prereq: none
- links: https://runwayml.com
- discourse: Long-standing production video tool

### CapCut / Dreamina (web & app)
- what: Free browser and phone editor with built-in AI image and video generation
- why_fun: Full short-form video pipeline without leaving one app
- tier: core
- tracks: media
- prereq: none
- links: https://dreamina.capcut.com
- discourse: Very common creator path

### Suno (web)
- what: Browser AI music generator — type a prompt, get a full song
- why_fun: Instant soundtrack or jingle for any project
- tier: core
- tracks: media, game
- prereq: none
- links: https://suno.com
- discourse: Default fun music tool

### ElevenLabs (web)
- what: Browser voice generation and cloning
- why_fun: Give any character or video a real-sounding voice in seconds
- tier: core
- tracks: media, game
- prereq: none
- links: https://elevenlabs.io
- discourse: Standard voice tool

### BMAD Method (agent workflow)
- what: Structured multi-agent process that turns an idea into planned software
- why_fun: Bigger projects actually finish instead of dissolving into chat chaos
- tier: trending
- tracks: app, game, portfolio
- prereq: Claude Code or Cursor
- links: https://github.com/bmad-code-org/BMAD-METHOD
- discourse: Repeatedly shared on X through 2026

### Caveman skill
- what: Forces the agent to answer in ultra-short language, cutting token use
- why_fun: Same useful answer, far less fluff and cost
- tier: trending
- tracks: all
- prereq: Claude Code or similar
- links: https://github.com/JuliusBrussee/caveman
- discourse: Actively installed and discussed on X

### HyperFrames skills (official)
- what: Slash commands that teach the agent how to write and render HyperFrames videos
- why_fun: “Make a 30-second pitch video” becomes a real workflow
- tier: trending
- tracks: media, portfolio
- prereq: HyperFrames + skill install
- links: https://hyperframes.mintlify.app
- discourse: Used in recent agent video-editing posts

### Remotion skills
- what: Official skills so coding agents write correct Remotion React video code
- why_fun: Prompt a video and get editable React instead of a black-box MP4
- tier: trending
- tracks: media, portfolio
- prereq: Remotion + skill install
- links: https://www.remotion.dev/docs/ai/coding-agents
- discourse: Official agent path for Remotion

### Agent Plugins 1.0 standard
- what: Portable package format that bundles skills + MCP config for any agent client
- why_fun: One plugin works in Cursor, Claude Code, Copilot, etc.
- tier: trending
- tracks: app
- prereq: none
- links: UNVERIFIED Agent Plugins 1.0 (AAIF)
- discourse: New open standard discussed August 2026

### One MCP (700+ apps)
- what: Single MCP server that gives agents access to hundreds of real apps via OAuth
- why_fun: Agent can act inside many tools without separate API keys
- tier: trending
- tracks: app
- prereq: Cursor or Claude Code
- links: UNVERIFIED One / cursor.directory/plugins/one
- discourse: Shared on X August 2026

### Remote MCP servers (URL + key style)
- what: MCP servers you connect to with just a URL, no local process
- why_fun: Zero install beyond pasting a link and key
- tier: trending
- tracks: app
- prereq: What an MCP server is
- links: UNVERIFIED various (e.g. trading, data tools)
- discourse: Growing pattern for hosted tools

### Veo (via Gemini / Google)
- what: Google’s video model with native audio, available in browser
- why_fun: Short films that already have sound, no extra tools
- tier: trending
- tracks: media
- prereq: none
- links: https://deepmind.google/technologies/veo/
- discourse: Frequently compared in 2026 video threads

### Grok Imagine (image + video)
- what: xAI’s browser image and short video generation with audio
- why_fun: Fast creative experiments inside the Grok interface
- tier: trending
- tracks: media
- prereq: none
- links: https://x.ai
- discourse: Mentioned alongside other 2026 creative models

### Meta AI Imagine (web)
- what: Free unlimited image (and some video) generation in browser
- why_fun: Endless images with almost no limits or signup friction
- tier: trending
- tracks: media
- prereq: none
- links: https://www.meta.ai
- discourse: Noted as truly free/unlimited option

### Perchance (web)
- what: Completely free image generator, no account required
- why_fun: Instant experiments when you just want to try ideas
- tier: trending
- tracks: media
- prereq: none
- links: https://perchance.org
- discourse: Frequently listed as zero-friction free tool

### Krea (web)
- what: Real-time browser image generation and editing
- why_fun: Watch the image form as you type and steer it live
- tier: trending
- tracks: media
- prereq: none
- links: https://krea.ai
- discourse: Popular interactive creation tool

### Wireflow / hosted Remotion-style pipelines
- what: Browser or API tools that give Remotion-like video without running servers
- why_fun: Programmatic video without managing any infrastructure
- tier: trending
- tracks: media
- prereq: none
- links: UNVERIFIED Wireflow and similar
- discourse: Appears in “Remotion without self-hosting” discussions

### Remocn Studio
- what: Describe a video; an agent builds a real Remotion project you can preview and export
- why_fun: Motion design as a conversation, not a timeline
- tier: frontier
- tracks: media, portfolio
- prereq: none
- links: https://remocn.studio
- discourse: Newer agent-native Remotion surface

### Framepack (HyperFrames director plugin)
- what: Higher-level agent layer that plans story and assets before HyperFrames renders
- why_fun: Messy creative brief becomes a structured video project
- tier: frontier
- tracks: media
- prereq: HyperFrames
- links: https://github.com/ARTHUR-BBU/framepack
- discourse: Recent HyperFrames ecosystem extension

### Skills-over-MCP packaging
- what: Growing preference for skills (portable behavior) over raw MCP when possible
- why_fun: Cleaner, more reusable agent capabilities
- tier: frontier
- tracks: app
- prereq: What a skill is
- links: UNVERIFIED AAIF / skills-over-MCP posts
- discourse: Explicit discussion August 2026

### Multi-app agent connectors (OAuth style)
- what: Single sign-in that lets one agent reach many SaaS tools
- why_fun: Agent can move files, post, or schedule without constant key management
- tier: frontier
- tracks: app
- prereq: MCP
- links: UNVERIFIED One and similar
- discourse: Emerging pattern on X

### Browser-native all-in-one creative suites
- what: Sites that combine image, video, and audio generation in one free or freemium tab
- why_fun: Full creative pipeline without installing or switching apps
- tier: frontier
- tracks: media
- prereq: none
- links: UNVERIFIED various 2026 suites (AI-0, ZSky-style, etc.)
- discourse: Growing “one tab does everything” category

---

## What I left out and why

- Anything that needs a local GPU, ComfyUI, Automatic1111, self-hosted Flux/SD, or heavy model downloads.
- Full local agent harnesses that assume you already live in the terminal all day.
- Career / resume / certification framing.
- Star counts, download numbers, and marketing superlatives.
- Tools whose main evidence was old SEO listicles rather than recent builder conversation on X.
- Complex self-hosted video render farms; kept only the agent-skill + hosted or simple CLI paths (HyperFrames, Remotion skills, Remocn, Wireflow-style).

This set is deliberately skewed toward “open a browser or run one `npx` / paste one MCP config and you’re making something.”
