class dvutils {
  renderBacklinksViewer(dv, section = "Note", use_location = true) {
    const pages = dv.current().file.inlinks.map((f) => dv.page(f));

    if (pages.length === 0) {
      return dv.paragraph("No backlinks found.");
    }

    pages.values
      .sort((p) => this._getBacklinkSortKey(p, use_location))
      .forEach((p) =>
        this._renderSectionLinkView(dv, p, section, (p) =>
          this._getBacklinkDisplayName(p, use_location)
        )
      );
  }

  renderJournalViewer(dv, section = "Note") {
    const pages = dv.pages('"journal"');

    if (pages.length === 0) {
      return dv.paragraph("No journal pages found.");
    }

    pages.values
      .sort((a, b) => b.file.name.localeCompare(a.file.name))
      .forEach((p) => this._renderSectionLinkView(dv, p, section));
  }

  renderActivePagesTable(dv) {
    dv.table(
      ["Active Assignment", "Type", "Due", "Tags", "Tasks", "Next"],
      dv
        .pages('"notes" AND #status/active AND -#isa/note')
        .values.map((p) => [
          p.file.link,
          this._tagsFilter(p.file.etags, ["#isa"]),
          p.due,
          this._tagsFilter(p.file.etags, ["#isa", "#status"], false, false),
          p.file.tasks.filter((t) => !t.completed).length,
          this.nextTaskDate(p),
        ])
        .sort((fields) => fields[2])
        .reverse()
    );
  }

  nextTaskDate(dvpage) {
    let nextDate = null; // Ughh! Can't use .reduce on a generator!!!
    dvpage.file.tasks.forEach((task) => {
      debugger;
      nextDate = task.completed
        ? nextDate
        : [dvpage.due, task.start, task.scheduled, task.due]
            .filter((d) => !!d)
            .reduce((a, b) => (a > b ? a : b), nextDate);
    });
    return nextDate;
  }

  _getBacklinkDisplayName(page, use_location) {
    return use_location && !!page.location
      ? `${page.location}) ${page.file.name}`
      : page.file.name;
  }

  _getBacklinkSortKey(page, use_location) {
    return use_location && Number.isInteger(page.location)
      ? page.location
      : this._getBacklinkDisplayName(page, use_location);
  }

  _renderSectionLinkView(dv, page, section, display_name_func = null) {
    this._renderSectionLinkHtml(dv, page, section, false, display_name_func);
    this._renderSectionLinkHtml(dv, page, section, true, display_name_func);
  }

  _renderSectionLinkHtml(dv, page, section, embed, display_name_func = null) {
    const display_name = display_name_func ?? ((p) => p.file.name);
    const attr = embed ? { "data-embed": true } : {};
    // Testing Obsidian Sync
    dv.paragraph(
      dv.sectionLink(
        page.file.path,
        section,
        embed,
        embed
          ? "Error: Failed to render section embed view."
          : display_name(page)
      ),
      { cls: "pagebacklink", attr }
    );
  }

  _tagsFilter(tags, baselist, ifin = true, strip = true) {
    return tags
      .filter((t) =>
        ifin
          ? baselist.includes(this._tagParts(t).base)
          : !baselist.includes(this._tagParts(t).base)
      )
      .map((t) => (strip ? this._tagParts(t).rest : t));
  }

  _tagParts(t) {
    const [base, ...rest] = t.split("/");
    return { base, rest: rest.join("/") };
  }
}
