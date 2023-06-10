#!/usr/bin/env bash -e
source include.sh
if [ -z ${local_customjs_dir+x} ]; then 
    echo "Failed to load include.sh"
    set
    exit 1
fi

for vault in $(find ../d5.*/.obsidian -type d -maxdepth 0 | xargs dirname); do
    echo; echo "Publishing overrides to to vault: "$vault; echo

    for subdir in $vault_customjs_dir $vault_snippets_dir $vault_shared_templates_dir; do
        mkdir -p $vault/$subdir
    done
    (set -x;
        rsync -ac $local_customjs_dir/* $vault/$vault_customjs_dir;
        rsync -ac $local_shared_templated_dir/* $vault/$vault_shared_templates_dir;
        rsync -ac  --exclude 'my-obsidian-colors.css' $local_snippets_dir/* $vault/$vault_snippets_dir;
    )
done