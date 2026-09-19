#!/bin/sh
# Fails when physical (non-logical) Tailwind direction classes appear in src/.
# Arabic RTL relies on logical utilities only: ps- pe- ms- me- start- end- text-start text-end.
pattern='(^|[[:space:]"'\''`:])-?(pl|pr|ml|mr|left|right|border-l|border-r|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br|scroll-ml|scroll-mr|scroll-pl|scroll-pr)-[^[:space:]"'\''`]+|text-(left|right)([[:space:]"'\''`]|$)'

matches=$(grep -rnE "$pattern" src --include='*.tsx' --include='*.ts' --include='*.css' || true)

if [ -n "$matches" ]; then
  echo "Physical direction classes found (use logical properties instead):"
  echo "$matches"
  exit 1
fi

echo "check:rtl passed"
