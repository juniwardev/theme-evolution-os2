#!/bin/sh
# C4b.2: shasum of the text between {% schema %} and {% endschema %} in the ten T4b sections (run from the repo root).
for f in collection collections search page blog article 404 password main-material-archive material-recommendations; do
  printf "%s " "$f"; awk '/\{% schema %\}/{f=1;next}/\{% endschema %\}/{f=0}f' "sections/$f.liquid" | shasum | cut -c1-40
done
