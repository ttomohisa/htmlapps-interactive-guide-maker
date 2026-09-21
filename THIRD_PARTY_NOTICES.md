# Third-Party Notices

Interactive Guide Maker v0.5.0 does not bundle third-party runtime library code.

The application uses browser-native APIs and system fonts. The GitHub Actions workflows reference their respective GitHub-maintained actions under the terms published by those projects.

When adding a package to `dependencies.json` in a future version:

1. Record its name, exact version, license, and homepage here.
2. Sync and commit the corresponding `dependencies.lock.json` entry.
3. Include every copyright notice and license text required for redistribution.
4. Update both README files when the dependency materially affects privacy, size, or capability.
5. Verify that all runtime support files are embedded and no CDN dependency is introduced.

Do not assume that a package being available from npm makes it compatible with MIT redistribution.
