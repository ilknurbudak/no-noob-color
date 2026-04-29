---
title: no noob color API
sdk: docker
app_port: 7860
license: mit
short_description: Color science microservice (FastAPI + sklearn + colour-science)
---

# no noob color — API

Python FastAPI microservice powering the [no noob color](https://github.com/ilknurbudak/no-noob-color) frontend.

## Endpoints

- `POST /extract/kmeans` — image → N dominant colors (k-means in Lab/RGB/OKLab)
- `POST /extract/colorthief` — image → palette via median-cut
- `POST /harmonize` — base color + rule → derivative palette
- `POST /contrast/wcag` — pair contrast (WCAG 2.1)
- `POST /contrast/audit` — full palette contrast matrix
- `POST /convert/spaces` — color → RGB / Lab / OKLab / CMYK / HSL / WCAG metadata

Try it: [/docs](./docs)
