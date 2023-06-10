#!/usr/bin/env bash -e
source include.sh
if [ -z ${local_customjs_dir+x} ]; then 
    echo "Failed to load include.sh"
    set
    exit 1
fi

for vault in $(find ../d5.*/.obsidian -type d -maxdepth 0 | xargs dirname); do
    echo "Publishing to vault: "$vault
    (set -x;
        echo "Copying customjs to "$vault/$vault_customjs_dir;
        mkdir -p $vault/$vault_customjs_dir
        cp -R $local_customjs_dir/* $vault/$vault_customjs_dir;

        echo "Copying snippets to "$vault/$vault_snippets_dir;
        mkdir -p $vault/$vault_snippets_dir
        cp -R $local_snippets_dir/* $vault/$vault_snippets_dir;

        echo "Copying shared tempates to "$vault/$vault_shared_templates_dir;
        mkdir -p $vault/$vault_shared_templates_dir
        cp -R $local_shared_templated_dir/* $vault/$vault_shared_templates_dir;
    )
    echo
done