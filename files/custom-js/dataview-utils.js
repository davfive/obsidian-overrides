class dvutils {
  renderActiveAssignmentsViewer(dv, { active } = { active: true }) {
    const status_query = active ? "#status/active" : "-#status/active";
    const nbspan = (d) =>
      dv.el("span", d, { attr: { style: "white-space: nowrap" } });
    debugger;
    dv.table(
      ["Assignment", "Type", "Due", "Tags", "Tasks", "Next Due"],
      dv
        .pages(`#assignment AND ${status_query}`)
        .values.map((p) => [
          p.file.link,
          this._tagsFilter(p.file.etags, ["#isa"]),
          nbspan(p.due),
          this._tagsFilter(p.file.etags, ["#isa", "#status"], false, false),
          p.file.tasks.filter((t) => !t.completed).length,
          nbspan(this.nextTaskDate(p)),
        ])
        .sort((fields) => fields[2])
        .reverse()
    );
  }

  renderJournalViewer(dv, section = "Journal") {
    const pages = dv.pages("#journal");

    if (pages.length === 0) {
      return dv.paragraph("No journal pages found.");
    }

    pages.values
      .sort((a, b) => b.file.name.localeCompare(a.file.name))
      .forEach((p) => this._renderSectionLinkView(dv, p, section));
  }

  nextTaskDate(dvpage) {
    let nextDate = null; // Ughh! Can't use .reduce on a generator!!!
    dvpage.file.tasks.forEach((task) => {
      nextDate = task.completed
        ? nextDate
        : [dvpage.due, task.start, task.scheduled, task.due]
            .filter((d) => !!d)
            .reduce((a, b) => (a > b ? a : b), nextDate);
    });
    return nextDate;
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
      { cls: "dvutils-sectionlink-rendered", attr }
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
