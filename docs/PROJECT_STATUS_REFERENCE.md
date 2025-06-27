# Project Status Reference

This document explains the structure, usage, and maintenance of the `project_status.yml` file, which is used to track development, test coverage, and progress across the automate_workloads codebase.

---

## What is `project_status.yml`?

`project_status.yml` is a living YAML file that provides a detailed, hierarchical map of all modules, files, and exported/public functions in the project. It tracks the implementation and test status of each item using a strict status progression, making it easy to visualize, queue, and manage work.

---

## Status Progression (Enforced Order)

- **planned**: Work is planned, not started
- **todo**: Ready to start, not yet in progress
- **blocked**: Cannot proceed, waiting on something
- **documented**: Documented, but not yet implemented
- **in-progress**: Actively being worked on
- **implemented**: Implementation complete, not yet tested/reviewed
- **tested**: Implementation complete and tested
- **reviewed**: Awaiting or under code review
- **deprecated**: No longer maintained or recommended

**You must move through these statuses in order.**

---

## Structure of `project_status.yml`

- **modules**: Top-level codebase areas (core, types, utils, services, cli, scripts)
- **files**: Each file in the module, with its exported/public functions/classes/interfaces
- **functions**: Each function/class/interface, with status
- **status**: Overall status for the module
- **notes**: Additional context or next steps
- **overall_summary**: Totals and completion percent
- **recommendations**: Next actions for the team

---

## Example Entry

```yaml
modules:
  utils:
    path: src/utils/
    files:
      - cli.ts:
          functions:
            - executeCommand: todo
            - executeCommandJSON: todo
            - formatOutput: todo
    status: todo
    notes: Needs unit tests
```

---

## How to Use and Update

1. **Add new files/functions** as you develop—start with `planned` or `todo`.
2. **Update status** as you implement, test, and review each function/module.
3. **Use the summary** to prioritize and queue work.
4. **Automate updates** if possible (e.g., as part of CI or pre-commit hooks).
5. **Keep this file in sync** with the codebase for accurate tracking.

---

## Why Use This File?

- **Visualize progress** at a glance
- **Enforce discipline** in development and testing
- **Queue and prioritize** work for individuals or teams
- **Support audits** and code reviews
- **Enable automation** for status checks and reporting

---

## Recommendations

- Move all items through the status progression as you work
- Regularly review and update the file
- Use only the enforced status progression for all updates
- Expand function/method breakdowns as needed for clarity
- Use this file as a reference in onboarding and team meetings

---

For questions or suggestions, update this document or contact the maintainers. 