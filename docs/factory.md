# Factory runtime

The factory has two workers, a 150 second job deadline, four playtest attempts
and a default budget of 20 jobs per hour. Each job gets a copied template,
a fresh git repo, an inbox JSON file and a writable out directory.
The pitch never becomes a prompt instruction, command, argument or file path.

CodexCliRunner invokes the installed codex exec command with JSONL output.
It deliberately uses no SDK dependency. The CLI already supports ChatGPT sign in
and provides the event stream and usage receipts this local application needs.
No OpenAI API key is required for CLI sign in.

MockCodexRunner replays curated games with visibly simulated factory steps.
Its thread ID and token counts are null. Duration measures the replay itself.
It does not claim to generate a new game or make an actual model call.
The server always runs its own harness afterward.

## Verified configuration

Verified with codex-cli 0.165.0 during this build. The runner rejects other minor versions
until the profile has been checked again. npm run factory:check runs an offline OS boundary probe.
It makes no model call and creates no Codex thread.

The command uses default_permissions and a named factory profile extending :workspace.
This is the workspace writing policy, narrowed so only out is writable.
Passing the legacy --sandbox workspace-write flag would override named permission profiles,
so the adapter intentionally omits that flag.
The filesystem table uses the nested :workspace_roots map, rather than putting glob keys
directly at the top level as in the original sketch.

The profile denies root reads, permits minimal runtime paths and explicit Codex and Node
installation roots, makes the workspace read only and grants write access to out.
The tool, schema, examples, inbox and instructions stay read only.
It denies matching .env, .env.* and tokens*.json files.
The controller keeps authentication outside the job, scrubs its child environment to a short allowlist,
and configures shell_environment_policy.inherit as core and ignore_default_excludes as false.
It disables command network access, login shells, apps, plugins, multi_agent, memories and web search.
User config and execpolicy rules are ignored. Sessions are ephemeral and use no shared daemon.

The preflight confirmed blocked reads of planted env and token files and a sibling file,
blocked modification of the protected tool, successful output writes and EPERM on a TCP connection.
It uses a marker file rather than relying on sandbox stdout forwarding.
A root denied sandbox can allow writes to its private empty filesystem view.
Probe files outside the output directory did not appear on the host.
No production secret was used in these probes.

The model controller still uses its own authenticated connection to Codex.
Command network isolation does not block that service connection.
Permission profiles are a beta feature. The preflight fails closed if the installed host cannot enforce them.
The factory never falls back to unrestricted execution.

Official references checked during the build:
[Permissions](https://learn.chatgpt.com/docs/permissions),
[Configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference).
CLI help confirmed exec JSONL output, skip-git-repo-check, cd, ignore-user-config,
ignore-rules, ephemeral and strict-config.
The sandbox command validated the actual permission tables through successful execution.

## Event receipts

Only fixed labels and allowlisted report codes become factory steps.
Raw commands, agent prose, command output and stderr never reach the overlay or audit log.
Receipts record the emitted thread ID, configured model, measured duration,
unique playtest commands and usage from turn.completed. Unknown usage remains null.
A bounded streaming parser handles fragmented UTF-8 and JSONL records.
Timeouts and the kill switch terminate the CLI process group.

The fixture in apps/server/fixtures/codex.jsonl is a sanitized synthetic sequence
based on thread.started, item.started, item.completed and turn.completed shapes
observed in the main build log. Its usage numbers are test values.
It is not a receipt for a real runtime factory job.

## Template maintenance

npm run build copies packages/engine/examples into the template,
copies the authoritative schema and SPEC.md, copies factory/designer instructions and config,
and generates the bundled harness from source.
Runtime agents may edit only out. The server reads fixed output filenames
and never executes anything found there.
