# Security Policy

This repository contains a Claude skill, a Remotion template and local scripts. It runs no servers and
handles no credentials.

## Reporting

If you find a security issue, report it privately through GitHub's
[private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
on this repository instead of opening a public issue. Examples: a script that could execute untrusted
content, or a fetch script pointing to a compromised source. Expect an initial response within a week.

## Notes for users

- `fetch_hrtf.sh` and `fetch_kenney.sh` download third-party archives. Review the URLs before running and keep
  downloads in their own folders.
- Treat any downloaded asset as untrusted data. The scripts only copy audio files and license texts.
