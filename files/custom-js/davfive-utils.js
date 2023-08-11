class d5utils {
  renderActiveTrackerViewer(
    dv,
    { active, hideCols } = { active: true, hideCols: [] }
  ) {
    hideCols = Array.isArray(hideCols) ? hideCols : [];
    const trackers = this._trackerGetByGroups(dv);
    this._trackerWriteBreadcrumbs(dv, trackers);
    Object.keys(trackers)
      .sort()
      .forEach((group) => {
        this._trackerGroupWriteHeader(dv, group, trackers);
        this._trackerGroupWriteTable(dv, group, hideCols, trackers);
        this._trackerGroupWriteTasks(dv, group, trackers);
        dv.el("hr", "");
      });
  }

  _nbspan(dv, text) {
    return dv.el("span", text, { attr: { style: "white-space: nowrap" } });
  }

  _toSentenceCase(s) {
    return s
      .trim()
      .toLocaleLowerCase()
      .replace(/^(.)/, String.call.bind("".toUpperCase));
  }

  _trackerGetByGroups(dv) {
    const sort_by_date_reverse = (a, b) => {
      // Sort oldest happens date first, with no happens dates at end
      if (a && b) {
        return b - a;
      } else {
        return a ? 1 : b ? -1 : 0;
      }
    };
    const sort_by_pagedue = (a, b) => sort_by_date_reverse(a.due, b.due);
    const sort_by_happens = (a, b) =>
      sort_by_date_reverse(a.happens, b.happens);

    return dv
      .pages('-"_" AND -"archive" AND -#status/done')
      .values.filter((p) => {
        if (d5utils.page.isTracker(p) || d5utils.page.numActiveTasks(p)) {
          p.happens = d5utils.page.happensDate(p);
          return true;
        }
        return false;
      })
      .sort(sort_by_pagedue)
      .sort(sort_by_happens)
      .reduce((bygroup, p) => {
        const group = d5utils.page.isDelegated(p)
          ? "delegated"
          : d5utils.page.numActiveTasks(p)
          ? "active"
          : "stale";
        !(group in bygroup) && (bygroup[group] = []);
        bygroup[group].push(p);
        return bygroup;
      }, {});
  }

  _trackerGroupTitle(group, trackers) {
    return `${this._toSentenceCase(group)} Trackers (${
      trackers[group].length
    })`;
  }

  _trackerWriteBreadcrumbs(dv, trackers) {
    Object.keys(trackers)
      .sort()
      .map((group, index) => {
        index > 0 && dv.span(" | ");
        dv.el("a", this._trackerGroupTitle(group, trackers), {
          attr: { href: `#${group}` },
        });
      });
  }

  _trackerGroupWriteHeader(dv, group, trackers) {
    dv.el("a", "", { attr: { name: group } });
    dv.header(2, this._trackerGroupTitle(group, trackers));
  }

  _trackerGroupWriteTable(dv, group, hideCols, trackers) {
    debugger;
    const tagsFilterList = ["#status"];
    const cols = {
      Tracker: (p) => p.file.link,
      Type: (p) => d5utils.page.tagsFilter(p, ["#isa"]),
      Due: (p) => this._nbspan(dv, p.due),
      Tags: (p) =>
        d5utils.page.tagsFilter(p, tagsFilterList, false, false).sort(),
      Happens: (p) => this._nbspan(dv, p.happens),
    };
    hideCols.filter((c) => c in cols).forEach((c) => delete cols[c]);
    if ("Type" in cols) {
      // Hide type tag if Type column exists
      tagsFilterList.append("#isa");
    }
    dv.table(
      Object.keys(cols),
      trackers[group]
        .map((p) => Object.values(cols).map((valfn) => valfn(p)))
        .reverse()
    );
  }

  _trackerGroupWriteTasks(dv, group, trackers) {
    trackers[group].reverse().forEach((p) => {
      const tasks = p.file.tasks.where(d5utils.task.isActive);
      if (tasks.length) {
        dv.taskList(tasks);
      }
    });
  }

  //
  // HACK: Because obsidian-custom-js won't let me have other functions in this file
  //   Not optimal (delays rendering a bit), but ya gotta do the best with what you're given.
  //
  static page = {
    activeTasks: (p) => p.file.tasks.where(d5utils.task.isActive),
    happensDate: (dvpage) => {
      let nextDate = undefined; // dvpage.due; // Don't use page due anymore for task happens
      dvpage.file.tasks.forEach((task) => {
        nextDate = !d5utils.task.isActive(task)
          ? nextDate
          : [task.start, task.scheduled, task.due]
              .filter((d) => !!d)
              .reduce((a, b) => (b > a ? a : b), nextDate);
      });
      return nextDate;
    },
    isDelegated: (p) =>
      d5utils.page.tagsFilter(p, ["#status"], true, true).includes("delegated"),
    isTracker: (p) =>
      p.file.path.startsWith("trackers") || p.file.etags.includes("#tracker"),
    numActiveTasks: (p) => d5utils.page.activeTasks(p).length,
    tagsFilter: (p, baselist, ifin = true, strip = true) =>
      p.file.etags
        .filter((t) =>
          ifin
            ? baselist.includes(d5utils.tag.parts(t).base)
            : !baselist.includes(d5utils.tag.parts(t).base)
        )
        .map((t) => (strip ? d5utils.tag.parts(t).rest : t)),
  };

  static tag = {
    parts: (t) => {
      const [base, ...rest] = t.split("/");
      return { base, rest: rest.join("/") };
    },
  };

  static task = {
    isActive: (t) => !["x", "-"].includes(t.status),
  };
}
