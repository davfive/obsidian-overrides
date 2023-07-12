class dvutils {
  renderActiveTrackerViewer(dv, { active } = { active: true }) {
    const nbspan = (text) =>
      dv.el("span", text, { attr: { style: "white-space: nowrap" } });

    // Break pages by tasks status
    const trackers = dv
      .pages('-"_" AND -"archive" AND -#status/done')
      .values.reduce((acc, p) => {
        if (!this._pageIsTracker(p) && p.file.tasks.length === 0) {
          return acc;
        }

        p.happens = this._happensDate(p);
        const num_tasks = p.file.tasks.filter(this._taskIsActive).length;
        let group = num_tasks > 0 ? "active" : "stale";
        if (this._pageIsDelegated(p)) {
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
              p.file.tasks.filter(this._taskIsActive).length,
              nbspan(p.happens),
            ])
            .reverse()
        );

        trackers[status]
          .sort(sort_by_happens)
          .reverse()
          .forEach((p) => {
            const tasks = p.file.tasks.where(this._taskIsActive);
            if (tasks.length) {
              dv.taskList(tasks);
            }
          });

        dv.el("hr", "");
      });
  }

  _happensDate(dvpage) {
    let nextDate = dvpage.due;
    dvpage.file.tasks.forEach((task) => {
      nextDate = !this._taskIsActive(task)
        ? nextDate
        : [task.start, task.scheduled, task.due]
            .filter((d) => !!d)
            .reduce((a, b) => (b > a ? a : b), nextDate);
    });
    return nextDate;
  }

  _pageIsDelegated(p) {
    this._tagsFilter(p.file.etags, ["#status"], true, true).includes(
      "delegated"
    );
  }

  _pageIsTracker(p) {
    return (
      p.file.path.startsWith("trackers") || p.file.etags.includes("#tracker")
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

  _taskIsActive(t) {
    return !["x", "-"].includes(t.status);
  }

  _toSentenceCase(s) {
    return s
      .trim()
      .toLocaleLowerCase()
      .replace(/^(.)/, String.call.bind("".toUpperCase));
  }
}
