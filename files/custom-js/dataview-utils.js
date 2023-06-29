class dvutils {
  renderActiveTrackerViewer(dv, { active } = { active: true }) {
    const nbspan = (d) =>
      dv.el("span", d, { attr: { style: "white-space: nowrap" } });

    // Don't use t.completed since have have extended todo status types
    const taskIsActive = (t) => !["x", "-"].includes(t.status);

    const isDelegated = (p) =>
      this._tagsFilter(p.file.etags, ["#status"], true, true).includes(
        "delegated"
      );

    // Break pages by tasks status
    const trackers = dv
      .pages('-"_" AND -"archive" AND -#status/done')
      .values.reduce((acc, p) => {
        if (!p.file.path.startsWith("trackers") && p.file.tasks.length === 0) {
          return acc;
        }

        p.happens = this.happensDate(p);
        const num_tasks = p.file.tasks.filter(taskIsActive).length;
        let group = num_tasks > 0 ? "active" : "stale";
        if (isDelegated(p)) {
          group = "delegated";
        }

        if (!(group in acc)) acc[group] = [];
        acc[group].push(p);
        return acc;
      }, {});

    const trackerGroupTitle = (status) =>
      `${this._toSentenceCase(status)} Trackers (${trackers[status].length})`;

    Object.keys(trackers)
      .sort()
      .map((status, index) => {
        index > 0 && dv.span(" | ");
        dv.el("a", trackerGroupTitle(status), { attr: { href: `#${status}` } });
      });

    // Render tracker tables and tasks
    const sort_by_happens = (a, b) => {
      // Sort oldest happens date first, with no happens dates at end
      if (a.happens && b.happens) {
        return b.happens - a.happens;
      } else {
        return a.happens ? 1 : b.happens ? -1 : 0;
      }
    };

    Object.keys(trackers)
      .sort()
      .forEach((status) => {
        dv.el("a", "", { attr: { name: status } });
        dv.header(2, trackerGroupTitle(status));

        dv.table(
          ["Tracker", "Type", "Due", "Tags", "Tasks", "Happens"],
          trackers[status]
            .sort(sort_by_happens)
            .map((p) => [
              p.file.link,
              this._tagsFilter(p.file.etags, ["#isa"]),
              nbspan(p.due),
              this._tagsFilter(
                p.file.etags,
                ["#isa", "#status"],
                false,
                false
              ).sort(),
              p.file.tasks.filter(taskIsActive).length,
              nbspan(p.happens),
            ])
            .reverse()
        );

        trackers[status]
          .sort(sort_by_happens)
          .reverse()
          .forEach((p) => {
            const tasks = p.file.tasks.where(taskIsActive);
            if (tasks.length) {
              dv.taskList(tasks);
            }
          });

        dv.el("hr", "");
      });
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

  happensDate(dvpage) {
    let nextDate = dvpage.due;
    dvpage.file.tasks.forEach((task) => {
      nextDate = task.completed
        ? nextDate
        : [task.start, task.scheduled, task.due]
            .filter((d) => !!d)
            .reduce((a, b) => (b > a ? a : b), nextDate);
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

  _toSentenceCase(s) {
    return s
      .trim()
      .toLocaleLowerCase()
      .replace(/^(.)/, String.call.bind("".toUpperCase));
  }
}
