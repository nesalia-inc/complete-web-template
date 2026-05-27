---
name: issue-investigation-comments
description: Send investigation result comment on GitHub issues
type: feedback
---

**Rule:** When analyzing a GitHub issue without modifying code, always add an investigation results comment before concluding.

**Why:** It documents the analysis for the team and provides visibility into the investigation process. The user (French-speaking developer) finds this very helpful.

**How to apply:** After completing code analysis and root cause identification on GitHub issues, add a comment with:
- Root cause summary
- Evidence found
- Evidence against alternatives ruled out
- Recommended fix approach

Even if the fix is simple (one-liner), the comment format helps team members understand the decision-making process.