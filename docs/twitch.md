# Connect your Twitch channel

Register a Twitch developer application. For the redirect flow, add http://localhost:8787/callback as an OAuth redirect URL. Keep the client secret in .env. Make your bot a moderator in the broadcaster channel.

Set TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_BROADCASTER_LOGIN and TWITCH_BOT_LOGIN. Leave MOCK_TWITCH and MOCK_CODEX unset for live operation. Run npm run auth, follow the printed broadcaster URL while signed in as the broadcaster, then follow the bot URL while signed in as the bot. The returned account must match the configured login.

On a headless host, use npm run auth -- --device --role=broadcaster and then npm run auth -- --device --role=bot. Enter each user code on the verification page from another browser. No localhost callback is used. See [setup](setup.md) for the waiting and expiry behavior. This device implementation has been tested with fake fetch only.

The default token file is ~/.config/pitch-arcade/tokens.json with mode 0600. TWITCH_TOKEN_PATH can select another location outside this repository. Never paste a token into chat, a screenshot or an issue. npm run auth:check validates both accounts and prints scopes only. npm run doctor checks the runtime, configuration, private token file, Twitch ID reachability and Codex installation without exposing credentials.

The bot requests user:read:chat, user:write:chat and user:bot. The broadcaster requests channel:bot, clips:edit and user:read:chat. For optional pin and stream marker features, authorize with TWITCH_STRETCH=1, then enable TWITCH_PIN=1 or TWITCH_MARKERS=1. Pinning needs the bot to be a moderator. These optional features are off by default.

Run npm run start. Missing settings produce a friendly list of variable names. Twitch accounts are validated at startup and hourly. Expired access tokens refresh through the refresh token grant, with replacement refresh tokens saved atomically. An unsuccessful validation ends the Twitch session. Reauthorize if a user revokes access.

EventSub connects to wss://eventsub.wss.twitch.tv/ws. TWITCH_EVENTSUB_URL can override it for a local fixture or another path on the Twitch EventSub host. Subscriptions use the broadcaster ID and bot user ID obtained from validation, with channel.chat.message version 1. The subscription starts immediately after welcome and has a nine second deadline. Keepalives have a watchdog. Migration opens the supplied reconnect URL while retaining the old connection until the new welcome, within thirty seconds. A drop reconnects and resubscribes. Twitch does not replay missed events.

Chat has a conservative budget of twenty sends per rolling thirty seconds and at least one second between messages. Rate reset headers delay subsequent requests. Clip requests use the broadcaster token, the game and designer title, and twenty second duration. Get Clips polling lasts at most sixty seconds. Disabled clips, an offline stream or upstream failures leave the game running. Successful clip links and gauntlet summaries go to chat and the local result ticker. Designer beats persist in SQLite even if Twitch fails.

## Try the real protocol locally

npm run demo:twitch-sim starts local EventSub and fake Helix servers, the actual EventSub and Helix clients, mock factory generation and the four arcade pages. Simulated viewer pitches flow over WebSocket, receive real HTTP subscription and chat calls, build games and start a humanish gauntlet. Clip responses use fixture URLs and are labeled simulated. They are not published Twitch clips. The fake endpoints bind only to loopback and need no credentials.

npm run demo remains fully offline with mock chat and mock generation. MOCK_CODEX=1 can also pair simulated generation with a real Twitch connection. OPENAI_API_KEY enables moderation only and is never passed into factory commands.

Protocol references: [WebSocket lifecycle](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/), [token validation](https://dev.twitch.tv/docs/authentication/validate-tokens/), [token refresh](https://dev.twitch.tv/docs/authentication/refresh-tokens/), [API reference](https://dev.twitch.tv/docs/api/reference/).
