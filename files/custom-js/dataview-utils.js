class DataviewUtils {
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
}
