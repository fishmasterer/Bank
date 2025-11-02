# Claude Code Infrastructure Setup

This directory contains Claude Code infrastructure that enables automatic skill activation and AI-assisted development.

## What Was Added

```
.claude/
├── agents/                     # Specialized AI agents
│   ├── code-architecture-reviewer.md
│   ├── documentation-architect.md
│   └── frontend-error-fixer.md
├── hooks/                      # Auto-activation hooks
│   ├── skill-activation-prompt.sh    (ESSENTIAL)
│   ├── skill-activation-prompt.ts    (ESSENTIAL)
│   ├── post-tool-use-tracker.sh      (ESSENTIAL)
│   ├── package.json
│   └── node_modules/
├── skills/                     # Development guidelines
│   ├── frontend-dev-guidelines/
│   │   ├── SKILL.md           # Main skill file
│   │   └── resources/         # Detailed guides
│   └── skill-rules.json       # Activation rules
└── settings.json               # Hook configuration
```

## How It Works

### 1. Auto-Activating Skills

When you work with Claude Code in this repository:

- **Edit a React component** → `frontend-dev-guidelines` skill auto-suggests
- **Type "create component"** → Skill activates based on keywords
- **Work in any .jsx/.tsx file** → Skill detects file patterns

This is powered by:
- `skill-activation-prompt` hook (runs on every prompt)
- `skill-rules.json` (defines when skills activate)

### 2. Specialized Agents

You can invoke agents for specific tasks:

- **frontend-error-fixer** - Debug React/Firebase errors
- **documentation-architect** - Generate comprehensive docs
- **code-architecture-reviewer** - Review code structure

### 3. Context Tracking

The `post-tool-use-tracker` hook tracks file changes, helping Claude maintain context across your coding session.

## Using Skills

### Automatic Activation

Skills activate automatically when:
- You edit files matching patterns in `skill-rules.json`
- You use keywords like "component", "React", "Firebase", etc.
- You ask about relevant topics

### Manual Activation

You can also manually activate skills in Claude Code.

## Customization

### Adjusting Activation Rules

Edit `.claude/skills/skill-rules.json` to customize when skills activate:

```json
{
  "skills": {
    "frontend-dev-guidelines": {
      "promptTriggers": {
        "keywords": ["add", "your", "custom", "keywords"]
      },
      "fileTriggers": {
        "pathPatterns": [
          "your-custom-path/**/*.js"
        ]
      }
    }
  }
}
```

### Adding More Skills

You can add additional skills from the showcase repository:
1. Copy skill folder to `.claude/skills/`
2. Add entry to `skill-rules.json`
3. Customize activation patterns

## What Each File Does

### settings.json
Configures which hooks run and when. Currently enables:
- Skill auto-activation on every prompt
- File change tracking after edits

### skill-rules.json
Defines patterns that trigger skill activation:
- **Keywords** in your prompts
- **File paths** you're editing
- **Priority** levels for each skill

### Hooks
- `skill-activation-prompt.*` - Analyzes your prompts and suggests relevant skills
- `post-tool-use-tracker.sh` - Tracks which files you're modifying

### Skills
- `frontend-dev-guidelines/` - React, Firebase, performance patterns
  - Main SKILL.md file (overview)
  - resources/ folder (detailed guides)

## Testing Your Setup

1. **Open Claude Code** in this repository
2. **Try a prompt**: "Help me refactor the expense form component"
3. **Expected**: The frontend-dev-guidelines skill should automatically suggest itself
4. **Edit a component file**: Skills should activate based on file path

## Troubleshooting

### Skills Not Activating?

1. Check `.claude/settings.json` exists and hooks are configured
2. Verify hooks are executable: `ls -la .claude/hooks/*.sh`
3. Check `skill-rules.json` has correct paths for your project
4. Review hook logs (if available in Claude Code)

### Need to Update Paths?

Your project structure:
```
family-expense-admin/    (React app)
family-expense-viewer/   (React app)
family-expense-tracker/  (Original version)
```

If you reorganize, update the `pathPatterns` in `skill-rules.json`.

## Learning More

- **Showcase Repo**: https://github.com/diet103/claude-code-infrastructure-showcase
- **Integration Guide**: Read `CLAUDE_INTEGRATION_GUIDE.md` in the showcase
- **Skill Documentation**: See `.claude/skills/frontend-dev-guidelines/SKILL.md`

## Source

This infrastructure is based on [claude-code-infrastructure-showcase](https://github.com/diet103/claude-code-infrastructure-showcase), a production-tested reference library from 6 months of real-world Claude Code usage.

## License

This infrastructure is MIT licensed. Use freely in your projects.
