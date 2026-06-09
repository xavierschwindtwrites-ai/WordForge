# Releasing WordForge

Releases are built and published automatically by GitHub Actions when you push
a version tag.

1. Bump the version in `package.json` (e.g. `0.1.0` → `0.2.0`).
2. Commit the bump:
   ```
   git commit -am "Release v0.2.0"
   ```
3. Tag and push:
   ```
   git tag v0.2.0
   git push origin main --tags
   ```

The `release.yml` workflow then:

- builds the macOS `.dmg` + `.zip` (unsigned — `CSC_IDENTITY_AUTO_DISCOVERY=false`)
- builds the Windows `.exe` (Squirrel)
- creates a GitHub Release with all artifacts attached and auto-generated notes

No Apple Developer account or code-signing certificate is required. macOS users
clear the quarantine flag once after install:

```
xattr -cr /Applications/WordForge.app
```

`ci.yml` runs `npm run package` on every push/PR to `main` as a build sanity check.
