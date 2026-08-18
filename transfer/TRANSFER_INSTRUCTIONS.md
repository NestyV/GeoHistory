# GeoHistory Progress Transfer Instructions

Date: 2026-07-01
Source branch: estable-v1.0

Artifacts created:
- transfer/GeoHistory-progress-2026-07-01.tar.gz
- transfer/GeoHistory-uncommitted-2026-07-01.patch

Checksums:
- 87470adbdb7ab2d1a6b4f2aaf1cd70beadd52cd8039d3ef4a37d4e4e899b6b22  GeoHistory-progress-2026-07-01.tar.gz
- 53a9665761c795fc53f119f9695eb9a6a2f724e864c31a8ab016983590d26765  GeoHistory-uncommitted-2026-07-01.patch

## On laptop (restore full working state)

1) Copy files to laptop (USB, cloud, or scp).
2) In destination folder:

   mkdir -p GeoHistory
   tar -xzf GeoHistory-progress-2026-07-01.tar.gz -C GeoHistory
   cd GeoHistory

3) Install dependencies:

   npm install
   cd backend && npm install && cd ..

4) Optional validation (recommended):

   sha256sum GeoHistory-progress-2026-07-01.tar.gz
   sha256sum GeoHistory-uncommitted-2026-07-01.patch

## Alternative restore (if you already cloned repo)

If you already have the repository cloned on laptop and only need uncommitted changes:

   cd GeoHistory
   git checkout estable-v1.0
   git apply GeoHistory-uncommitted-2026-07-01.patch

## Notes
- Archive excludes generated folders: .next, node_modules, backend/dist, coverage, transfer.
- README and all tracked project docs/files currently present in the workspace are included in the archive.
