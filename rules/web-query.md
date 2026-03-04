# Web Query Guidelines

## Use System Date for Current Information

- Before searching for up-to-date information, always retrieve the current system date
- Include the current year (and the previous year if relevant) in your search query to ensure recency
- Example: if today is 2026-03-01, search `2025 2026 ${query}` instead of just `${query}`
- Never assume the current year from your training data — always check the system clock

## Check Framework Version Before Code Changes

- When modifying code in a project that uses a framework (e.g., Next.js, React, Django), retrieve the framework's version from the project (e.g., `package.json`, `requirements.txt`, `go.mod`)
- Compare the installed version against the version you know from your training data
- If there is a **minor version bump or higher** (e.g., 14.x → 15.x), investigate the latest official documentation and changelogs
- Check for **breaking changes** in APIs, configuration, or behavior introduced since your knowledge cutoff
- Do not assume backward compatibility — verify before applying patterns you already know
