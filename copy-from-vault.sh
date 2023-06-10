#!/usr/bin/env bash
local_customjs_dir=files/custom-js
vault_customjs_dir=_/custom-js
mkdir -p $local_customjs_dir

local_snippets_dir=files/snippets
vault_snippets_dir=.obsidian/snippets
mkdir -p $local_snippets_dir

local_shared_templated_dir=files/templates
vault_shared_templates_dir=_/templates/shared
mkdir -p $local_shared_templated_dir

select vault in $(find ../d5.*/.obsidian -type d -maxdepth 0 | xargs dirname); do
    echo;
    echo "Copying overrides from: "$vault;
    (set -x;
        cp -R $vault/$vault_customjs_dir/. $local_customjs_dir;
        cp -R $vault/$vault_snippets_dir/. $local_snippets_dir;
        cp -R $vault/$vault_shared_templates_dir/. $local_shared_templated_dir;
    )
    break;
done