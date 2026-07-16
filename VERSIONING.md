# Versioning

The canonical application version is defined in `version.js`.

Versions use `a.b.c`:

- `a`: architecture updates, including major structural changes or incompatible runtime/data changes. Reset `b` and `c` to `0`.
- `b`: user-facing functionality updates. Reset `c` to `0`.
- `c`: bug fixes that do not add functionality or change the architecture.

Current version: `1.0.0`.

When changing the version, update only the `number` field in `version.js`, then update the cache query value in `index.html` to the same version.
