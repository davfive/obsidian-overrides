#!/usr/bin/env bash
local_customjs_dir=files/custom-js
vault_customjs_dir=_/custom-js

local_snippets_dir=files/snippets
vault_snippets_dir=.obsidian/snippets

for vault in $(find ../d5.*/.obsidian -type d -maxdepth 0 | xargs dirname); do
    echo "Publishing to vault: "$vault
    (set -x;
        cp -R $local_customjs_dir/* $vault/$vault_customjs_dir;
        cp -R $local_snippets_dir/* $vault/$vault_snippets_dir;
    )
    echo
done