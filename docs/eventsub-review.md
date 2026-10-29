# EventSub reconnect review

## What we know

The orchestrator reported a working real pitch and five generic reconnect messages in about 25 minutes. The old log omitted the cause, so the exact production trigger cannot be recovered from that message. This review used source inspection, indexed official documentation and local fixtures. It made no calls to live Twitch identity, Helix or EventSub services and did not inspect saved tokens.

## Findings and fixes

| Finding | Effect | Fix |
| --- | --- | --- |
| A 10 second keepalive window had only one extra second | Small scheduling or network delays could force a healthy socket closed | Silence now allows 1.5 times the advertised window plus three seconds. The default is 18 seconds |
| A second reconnect URL was ignored while a candidate existed | A newer migration target could be lost | Replace the candidate while keeping the old active socket and the original deadline |
| A failed candidate could leave its migration timer alive | A stale deadline could later terminate active sockets | Migration owns one deadline and retires its connections explicitly |
| Retired sockets retained callbacks until close | Old work could race with a new active session | Retirement clears watchdogs, cancels subscription work and ignores stale callbacks |
| A subscription error immediately terminated the socket | A temporary HTTP failure could become a reconnect cycle | Retry within an 8.5 second budget with backoff and one refresh after 401 |
| Subscribe shared a general rate reset wait | An unrelated chat limit could exceed the welcome deadline | Subscribe uses a separate urgent request path and honors its own 429 response |
| Close frames and error paths lacked causes | Normal closes and application watchdog failures were indistinguishable | Emit fixed cause labels, numeric close codes and HTTP statuses |

The tight watchdog is a likely contributor. Migration races and subscription failures are confirmed failure paths in the old code, but the original live messages cannot tell us which occurred. New diagnostics provide the evidence for the next deployment.

## Protocol boundaries

A new session must subscribe promptly after welcome. Migration retains subscriptions and keeps the old socket until the new welcome. Its total deadline remains thirty seconds even if the target changes. A real drop creates a fresh session and subscription. No application frames or client pings are sent to EventSub. The ws library answers server pings with pongs. These choices follow the [official lifecycle documentation](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/).

The source starts a nine second subscription watchdog immediately on welcome. Helix has at most 8.5 seconds for up to five attempts. Chat pacing never queues this request. A 401 refreshes once, 409 counts as already subscribed, and 403, 429, network and server failures get bounded retries. A rate reset that cannot fit the deadline fails safely and reconnects with backoff. Cancellation stops pending subscription fetches and retry timers. Response bodies are released. Status meanings come from the [Create EventSub Subscription reference](https://dev.twitch.tv/docs/api/reference/#create-eventsub-subscription).

## Transport and cleanup

The main server chooses exactly one of live, simulated or mock sources. liveTwitch creates one EventSub source, the application attaches its intake handler, and main starts it once. start is idempotent. Session subscription requests are coalesced. Migration makes no new subscription request.

One active socket and one migration candidate are used. The retired old socket gets a close frame after promotion and a bounded cleanup timer. Revocation and stop terminate every remaining socket, clear migration and retry timers and abort in flight subscription work. An independently started second server process remains outside this instance's control. Avoid overlapping live servers during restart.

The documented per token limits are three enabled WebSocket connections and 300 subscriptions per connection. This server needs one subscription on one connection, with a temporary migration overlap. See [subscription limits](https://dev.twitch.tv/docs/eventsub/manage-subscriptions/).

## Safe diagnostics

The existing sentence is retained with an added fixed label:

```text
Twitch chat is reconnecting. Events during a drop cannot be replayed. Cause: socket_close code=4003 connection_unused
```

Close labels cover codes 4000 through 4007: internal error, inbound traffic, ping pong failure, unused connection, expired reconnect grace, network timeout, network error and invalid reconnect. Welcome, keepalive, subscription and migration deadlines have separate labels. Subscription errors report HTTP status only. Revocation reports a known subscription type and a known status, or unknown.

No peer close reason, exception message, reconnect URL, session ID, chat content or token is included. Revocation stops the source until it is explicitly restarted after authorization is repaired. A handler_error label identifies intake failure rather than a transport drop.

## Verification

Local tests cover jitter, each heartbeat message path, candidate replacement, candidate failure, the migration deadline, old socket closure, 4003 recovery, revocation, stop cleanup and automatic pongs with no application frames. HTTP fixtures cover subscription coalescing, 409, one 401 refresh, retry success, 403 bounds, 429 reset timing, pacing isolation, cancellation and response cleanup. Diagnostic tests cover every Twitch close code and private upstream text suppression.

The suite passes 267 tests in 36 files. The orchestrator must restart the live server and observe the new cause labels. This change does not claim that a production reconnect has been reproduced or eliminated.
