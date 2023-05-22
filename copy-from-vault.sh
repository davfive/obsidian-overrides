#!/usr/bin/env bash
local_customjs_dir=files/custom-js
local_snippets_dir=files/snippets

vault_snippets_dir=.obsidian/snippets
vault_customjs_dir=_/custom-js

select vault in $(find ../d5.*/.obsidian -type d -maxdepth 0 | xargs dirname); do
    echo;
    echo "Copying overrides from: "$vault;
    (set -x;
        cp -R $vault/$vault_customjs_dir/* $local_customjs_dir;
        cp -R $vault/$vault_snippets_dir/* $local_snippets_dir;
    )
    break;
done