# Playwright MCP Usage Rules

## Absolute Restrictions

- Never execute code (Python, JavaScript, Bash, subprocess) to drive the browser
- Never run code to "investigate" what MCP tools are available
- The only permitted browser interaction is direct MCP tool calls

## Permitted MCP Tools

- `playwright:browser_navigate`
- `playwright:browser_screenshot`
- Other Playwright MCP tools as documented

## Error Handling

- On any error, report it immediately with the exact error message
- Do not search for workarounds or alternative approaches
- Do not retry with a different execution method
