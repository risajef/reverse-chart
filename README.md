# Reverse Chart

Static browser tools and documentation.

## Local App

```bash
python3 -m http.server 8000
```

Open `http://127.0.0.1:8000/`.

## Clone With Submodules

```bash
git clone --recurse-submodules https://github.com/risajef/reverse-chart.git
```

If the repository was cloned without submodules:

```bash
git submodule update --init --recursive
```

## Docs

The documentation lives in `docs/` and is wired through `mkdocs.yml`. The
maintainer checklist for adding another project is in
`docs/adding-project.de.md`.
