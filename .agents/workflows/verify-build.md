---
description: Runs the full suite of static analysis, type checking, and tests to verify project health.
---

// turbo-all

1. `pnpm run type-check`
2. `pnpm run lint`
3. `pnpm run build`

4. If all commands pass, notify the user that the build is clean and ready for deployment or PR.
5. If any command fails, automatically investigate the error logs and propose a fix using the `replace_file_content` tool.
