(function () {
  const data = (window.FOOD_DATA || []).map((row, index) => ({
    id: index,
    food_name: row.food_name,
    category: row.category,
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    iron: Number(row.iron),
    vitamin_c: Number(row.vitamin_c)
  })).filter((row) => Number.isFinite(row.calories));

  const nutrients = [
    { key: "protein", label: "Protein", unit: "g" },
    { key: "carbs", label: "Carbs", unit: "g" },
    { key: "fat", label: "Fat", unit: "g" },
    { key: "iron", label: "Iron", unit: "mg" },
    { key: "vitamin_c", label: "Vitamin C", unit: "mg" }
  ];

  const calorieNutrient = { key: "calories", label: "Calories", unit: "calories" };
  const allMetrics = [calorieNutrient, ...nutrients];
  const palette = ["#176f73", "#c6553d", "#446c95", "#c28b28", "#67806b", "#7e5a89", "#9b5d33", "#315f45"];
  const ageProfiles = {
    teen: {
      label: "Teen / student",
      title: "Teen / student",
      imageAlt: "Cartoon teen student with nutrition notes",
      imageClass: "teen",
      description: "A growth-focused view that rewards protein, iron, vitamin C, and enough energy without pushing the highest-calorie foods to the top.",
      priorities: ["Support growth and daily energy", "Look for protein and iron", "Keep calorie density in context"],
      note: "Ranked for growth support and balanced energy.",
      weights: { protein: 0.32, iron: 0.22, vitamin_c: 0.18, caloriesTarget: 0.18, fatLow: 0.10 },
      calorieTarget: 220
    },
    young_adult: {
      label: "Young adult",
      title: "Young adult",
      imageAlt: "Cartoon young adult with nutrition checklist",
      imageClass: "young-adult",
      description: "A flexible view for busy schedules: higher protein and micronutrients, with moderate calories and fat so the foods can fit into everyday meals.",
      priorities: ["Prioritize protein for fullness", "Favor vitamin C and iron when possible", "Balance calories, carbs, and fat"],
      note: "Ranked for protein, micronutrients, and practical calorie balance.",
      weights: { protein: 0.34, vitamin_c: 0.18, iron: 0.16, caloriesTarget: 0.18, fatLow: 0.14 },
      calorieTarget: 260
    },
    adult: {
      label: "Adult",
      title: "Adult",
      imageAlt: "Cartoon adult reviewing health data",
      imageClass: "adult",
      description: "A long-term health view that favors nutrient value while being more cautious about high calories and fat.",
      priorities: ["Watch calorie density", "Prefer foods with useful nutrients", "Notice fat and carb trade-offs"],
      note: "Ranked for nutrient value with a stronger calorie and fat check.",
      weights: { caloriesLow: 0.24, fatLow: 0.22, protein: 0.20, vitamin_c: 0.18, iron: 0.16 },
      calorieTarget: 220
    },
    older_adult: {
      label: "Older adult",
      title: "Older adult",
      imageAlt: "Cartoon older adult with balanced nutrition reminder",
      imageClass: "older-adult",
      description: "A nutrient-dense view that emphasizes protein and micronutrients while keeping calories and fat from crowding out the score.",
      priorities: ["Keep protein visible", "Value iron and vitamin C", "Avoid letting high calories dominate"],
      note: "Ranked for nutrient density and steadier calorie balance.",
      weights: { protein: 0.32, vitamin_c: 0.22, iron: 0.18, caloriesLow: 0.16, fatLow: 0.12 },
      calorieTarget: 210
    }
  };

  const state = {
    category: "All categories",
    nutrient: "protein",
    colorBy: "category",
    boxNutrient: "calories",
    ageGroup: "young_adult",
    categoryLimit: 10,
    selectedId: null
  };

  const els = {
    categorySelect: document.querySelector("#categorySelect"),
    nutrientSelect: document.querySelector("#nutrientSelect"),
    colorSelect: document.querySelector("#colorSelect"),
    ageGroupSelect: document.querySelector("#ageGroupSelect"),
    boxNutrientSelect: document.querySelector("#boxNutrientSelect"),
    categoryLimit: document.querySelector("#categoryLimit"),
    categoryLimitOutput: document.querySelector("#categoryLimitOutput"),
    scatterPlot: document.querySelector("#scatterPlot"),
    boxPlot: document.querySelector("#boxPlot"),
    scatterTitle: document.querySelector("#scatterTitle"),
    scatterSubtitle: document.querySelector("#scatterSubtitle"),
    detailName: document.querySelector("#detailName"),
    detailCategory: document.querySelector("#detailCategory"),
    detailMetrics: document.querySelector("#detailMetrics"),
    foodVisuals: document.querySelector("#foodVisuals"),
    ageGroupImage: document.querySelector("#ageGroupImage"),
    ageTitle: document.querySelector("#ageTitle"),
    ageDescription: document.querySelector("#ageDescription"),
    agePriorities: document.querySelector("#agePriorities"),
    recommendationTitle: document.querySelector("#recommendationTitle"),
    recommendationNote: document.querySelector("#recommendationNote"),
    recommendationCards: document.querySelector("#recommendationCards"),
    tooltip: document.querySelector("#tooltip"),
    resetSelection: document.querySelector("#resetSelection"),
    statFoods: document.querySelector("#statFoods"),
    statCategories: document.querySelector("#statCategories")
  };

  function unique(values) {
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }

  function metricFor(key) {
    return allMetrics.find((metric) => metric.key === key) || nutrients[0];
  }

  function formatValue(value, metric) {
    const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;
    return `${Number(value).toFixed(decimals)} ${metric.unit}`;
  }

  function categoryCounts(rows) {
    return rows.reduce((map, row) => {
      map.set(row.category, (map.get(row.category) || 0) + 1);
      return map;
    }, new Map());
  }

  function fillSelect(select, options, selected) {
    select.innerHTML = "";
    options.forEach((option) => {
      const el = document.createElement("option");
      el.value = option.value;
      el.textContent = option.label;
      el.selected = option.value === selected;
      select.appendChild(el);
    });
  }

  function initControls() {
    const categories = unique(data.map((row) => row.category));
    const counts = categoryCounts(data);
    fillSelect(els.categorySelect, [
      { value: "All categories", label: "All categories" },
      ...categories.map((category) => ({ value: category, label: `${category} (${counts.get(category)})` }))
    ], state.category);

    fillSelect(els.nutrientSelect, nutrients.map((metric) => ({ value: metric.key, label: metric.label })), state.nutrient);
    fillSelect(els.boxNutrientSelect, allMetrics.map((metric) => ({ value: metric.key, label: metric.label })), state.boxNutrient);
    fillSelect(els.ageGroupSelect, Object.entries(ageProfiles).map(([value, profile]) => ({ value, label: profile.label })), state.ageGroup);
    fillSelect(els.colorSelect, [
      { value: "category", label: "Category" },
      { value: "nutrient", label: "Selected nutrient" },
      { value: "calories", label: "Calories" }
    ], state.colorBy);

    els.statFoods.textContent = data.length.toLocaleString();
    els.statCategories.textContent = categories.length.toLocaleString();
    els.categoryLimitOutput.textContent = state.categoryLimit;

    els.categorySelect.addEventListener("change", (event) => {
      state.category = event.target.value;
      state.selectedId = null;
      renderAll();
    });
    els.nutrientSelect.addEventListener("change", (event) => {
      state.nutrient = event.target.value;
      renderAll();
    });
    els.colorSelect.addEventListener("change", (event) => {
      state.colorBy = event.target.value;
      renderScatter();
    });
    els.ageGroupSelect.addEventListener("change", (event) => {
      state.ageGroup = event.target.value;
      renderAgeRecommendations();
    });
    els.boxNutrientSelect.addEventListener("change", (event) => {
      state.boxNutrient = event.target.value;
      renderBoxPlot();
    });
    els.categoryLimit.addEventListener("input", (event) => {
      state.categoryLimit = Number(event.target.value);
      els.categoryLimitOutput.textContent = state.categoryLimit;
      renderBoxPlot();
    });
    els.resetSelection.addEventListener("click", () => {
      state.selectedId = null;
      updateDetails(null);
      renderScatter();
    });
    window.addEventListener("resize", debounce(renderAll, 120));
  }

  function filteredData() {
    if (state.category === "All categories") return data;
    return data.filter((row) => row.category === state.category);
  }

  function svgSize(svg, fallbackHeight) {
    const width = Math.max(320, svg.clientWidth || 800);
    const height = Math.max(360, svg.clientHeight || fallbackHeight);
    return { width, height };
  }

  function extent(rows, key) {
    const values = rows.map((row) => row[key]).filter(Number.isFinite);
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) return [0, max || 1];
    return [Math.min(0, min), max * 1.08];
  }

  function scaleLinear(domain, range) {
    const [d0, d1] = domain;
    const [r0, r1] = range;
    return (value) => r0 + ((value - d0) / (d1 - d0 || 1)) * (r1 - r0);
  }

  function ticks(max, count = 5) {
    if (!Number.isFinite(max) || max <= 0) return [0];
    const step = niceStep(max / count);
    const result = [];
    for (let value = 0; value <= max + step * 0.5; value += step) {
      result.push(Number(value.toFixed(6)));
    }
    return result;
  }

  function niceStep(raw) {
    const power = Math.pow(10, Math.floor(Math.log10(raw)));
    const fraction = raw / power;
    if (fraction <= 1) return power;
    if (fraction <= 2) return 2 * power;
    if (fraction <= 5) return 5 * power;
    return 10 * power;
  }

  function colorFor(row, rows) {
    if (state.colorBy === "category") {
      const categories = unique(rows.map((item) => item.category));
      const index = categories.indexOf(row.category);
      return palette[index % palette.length];
    }

    const key = state.colorBy === "calories" ? "calories" : state.nutrient;
    const values = rows.map((item) => item[key]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const ratio = (row[key] - min) / (max - min || 1);
    return interpolateColor([103, 128, 107], [198, 85, 61], ratio);
  }

  function interpolateColor(a, b, t) {
    const clamped = Math.max(0, Math.min(1, t));
    const channel = (index) => Math.round(a[index] + (b[index] - a[index]) * clamped);
    return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
  }

  function createSvgElement(name, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function clearSvg(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }

  function renderScatter() {
    const rows = filteredData();
    const metric = metricFor(state.nutrient);
    const { width, height } = svgSize(els.scatterPlot, 520);
    const margin = { top: 28, right: 22, bottom: 58, left: 64 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const xDomain = extent(rows, "calories");
    const yDomain = extent(rows, state.nutrient);
    const x = scaleLinear(xDomain, [margin.left, margin.left + innerWidth]);
    const y = scaleLinear(yDomain, [margin.top + innerHeight, margin.top]);

    clearSvg(els.scatterPlot);
    els.scatterPlot.setAttribute("viewBox", `0 0 ${width} ${height}`);
    els.scatterTitle.textContent = `Calories vs ${metric.label}`;
    els.scatterSubtitle.textContent = `${rows.length} foods shown${state.category === "All categories" ? "" : ` in ${state.category}`}.`;

    drawGrid(els.scatterPlot, x, y, xDomain, yDomain, margin, innerWidth, innerHeight);
    drawAxisLabels(els.scatterPlot, width, height, margin, "Calories", axisMetricLabel(metric));

    rows.forEach((row) => {
      const point = createSvgElement("circle", {
        class: `point${state.selectedId === row.id ? " is-selected" : ""}`,
        cx: x(row.calories),
        cy: y(row[state.nutrient]),
        r: state.selectedId === row.id ? 7 : 5,
        fill: colorFor(row, rows),
        opacity: state.selectedId === null || state.selectedId === row.id ? 0.9 : 0.42,
        tabindex: 0,
        role: "button",
        "aria-label": `${row.food_name}, ${row.category}`
      });

      point.addEventListener("mouseenter", (event) => showTooltip(event, row, metric));
      point.addEventListener("mousemove", (event) => moveTooltip(event));
      point.addEventListener("mouseleave", hideTooltip);
      point.addEventListener("click", () => {
        state.selectedId = row.id;
        updateDetails(row);
        renderScatter();
      });
      point.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          state.selectedId = row.id;
          updateDetails(row);
          renderScatter();
        }
      });
      els.scatterPlot.appendChild(point);
    });

    if (state.selectedId === null) updateDetails(rows[0]);
  }

  function drawGrid(svg, x, y, xDomain, yDomain, margin, innerWidth, innerHeight) {
    const xTicks = ticks(xDomain[1], 5);
    const yTicks = ticks(yDomain[1], 5);

    xTicks.forEach((tick) => {
      const tx = x(tick);
      svg.appendChild(createSvgElement("line", {
        class: "grid-line",
        x1: tx,
        x2: tx,
        y1: margin.top,
        y2: margin.top + innerHeight
      }));
      const label = createSvgElement("text", {
        class: "axis",
        x: tx,
        y: margin.top + innerHeight + 24,
        "text-anchor": "middle"
      });
      label.textContent = tick;
      svg.appendChild(label);
    });

    yTicks.forEach((tick) => {
      const ty = y(tick);
      svg.appendChild(createSvgElement("line", {
        class: "grid-line",
        x1: margin.left,
        x2: margin.left + innerWidth,
        y1: ty,
        y2: ty
      }));
      const label = createSvgElement("text", {
        class: "axis",
        x: margin.left - 10,
        y: ty + 4,
        "text-anchor": "end"
      });
      label.textContent = tick;
      svg.appendChild(label);
    });

    svg.appendChild(createSvgElement("line", {
      class: "axis",
      x1: margin.left,
      x2: margin.left + innerWidth,
      y1: margin.top + innerHeight,
      y2: margin.top + innerHeight
    }));
    svg.appendChild(createSvgElement("line", {
      class: "axis",
      x1: margin.left,
      x2: margin.left,
      y1: margin.top,
      y2: margin.top + innerHeight
    }));
  }

  function drawAxisLabels(svg, width, height, margin, xLabel, yLabel) {
    const xText = createSvgElement("text", {
      class: "plot-label",
      x: width / 2,
      y: height - 14,
      "text-anchor": "middle"
    });
    xText.textContent = xLabel;
    svg.appendChild(xText);

    const yText = createSvgElement("text", {
      class: "plot-label",
      x: -height / 2,
      y: 18,
      transform: "rotate(-90)",
      "text-anchor": "middle"
    });
    yText.textContent = yLabel;
    svg.appendChild(yText);
  }

  function updateDetails(row) {
    if (!row) {
      els.detailName.textContent = "Select a food";
      els.detailCategory.textContent = "Hover or click a point to inspect its full nutrition profile.";
      els.detailMetrics.innerHTML = "";
      return;
    }

    els.detailName.textContent = row.food_name;
    els.detailCategory.textContent = row.category;
    els.detailMetrics.innerHTML = "";
    allMetrics.forEach((metric) => {
      const item = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = metric.label;
      dd.textContent = formatValue(row[metric.key], metric);
      item.append(dt, dd);
      els.detailMetrics.appendChild(item);
    });
  }

  function showTooltip(event, row, metric) {
    els.tooltip.hidden = false;
    els.tooltip.innerHTML = `<strong>${escapeHtml(row.food_name)}</strong><br>${escapeHtml(row.category)}<br>Calories: ${formatValue(row.calories, calorieNutrient)}<br>${metric.label}: ${formatValue(row[metric.key], metric)}`;
    moveTooltip(event);
  }

  function showRangeTooltip(event, group, metric) {
    els.tooltip.hidden = false;
    els.tooltip.innerHTML = `<strong>${escapeHtml(group.category)}</strong><br>Median ${escapeHtml(metric.label)}: ${formatValue(group.stats.median, metric)}<br>Range: ${formatValue(group.stats.min, metric)} to ${formatValue(group.stats.max, metric)}<br>${group.values.length} foods`;
    moveTooltip(event);
  }

  function moveTooltip(event) {
    const offset = 14;
    const bounds = event.target && event.target.getBoundingClientRect ? event.target.getBoundingClientRect() : null;
    const clientX = Number.isFinite(event.clientX) && event.clientX > 0 ? event.clientX : (bounds ? bounds.right : 0);
    const clientY = Number.isFinite(event.clientY) && event.clientY > 0 ? event.clientY : (bounds ? bounds.top : 0);
    els.tooltip.style.left = `${Math.min(window.innerWidth - 280, clientX + offset)}px`;
    els.tooltip.style.top = `${Math.min(window.innerHeight - 150, clientY + offset)}px`;
  }

  function hideTooltip() {
    els.tooltip.hidden = true;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function renderBoxPlot() {
    const metric = metricFor(state.boxNutrient);
    const categoryMap = data.reduce((map, row) => {
      if (!Number.isFinite(row[state.boxNutrient])) return map;
      if (!map.has(row.category)) map.set(row.category, []);
      map.get(row.category).push(row[state.boxNutrient]);
      return map;
    }, new Map());

    const groups = [...categoryMap.entries()]
      .map(([category, values]) => {
        const sortedValues = values.sort((a, b) => a - b);
        return { category, values: sortedValues, stats: summarize(sortedValues) };
      })
      .sort((a, b) => b.stats.median - a.stats.median || b.values.length - a.values.length || a.category.localeCompare(b.category))
      .slice(0, state.categoryLimit);
    renderFoodVisuals(groups, metric);

    els.boxPlot.style.height = `${Math.max(560, groups.length * 46 + 96)}px`;
    const { width, height } = svgSize(els.boxPlot, 560);
    const margin = { top: 24, right: 72, bottom: 44, left: width < 640 ? 132 : 230 };
    const innerWidth = width - margin.left - margin.right;
    const rowHeight = (height - margin.top - margin.bottom) / groups.length;
    const max = Math.max(...groups.flatMap((group) => group.values)) * 1.08 || 1;
    const x = scaleLinear([0, max], [margin.left, margin.left + innerWidth]);

    clearSvg(els.boxPlot);
    els.boxPlot.setAttribute("viewBox", `0 0 ${width} ${height}`);

    ticks(max, 5).forEach((tick) => {
      const tx = x(tick);
      els.boxPlot.appendChild(createSvgElement("line", {
        class: "grid-line",
        x1: tx,
        x2: tx,
        y1: margin.top,
        y2: height - margin.bottom
      }));
      const label = createSvgElement("text", {
        class: "axis",
        x: tx,
        y: height - 16,
        "text-anchor": "middle"
      });
      label.textContent = tick;
      els.boxPlot.appendChild(label);
    });

    groups.forEach((group, index) => {
      const center = margin.top + rowHeight * index + rowHeight / 2;
      const { min, median, max: groupMax } = group.stats;
      const color = palette[index % palette.length];

      const label = createSvgElement("text", {
        class: "axis",
        x: margin.left - 12,
        y: center + 4,
        "text-anchor": "end"
      });
      label.textContent = shortLabel(group.category, width < 640 ? 18 : 30);
      els.boxPlot.appendChild(label);

      els.boxPlot.appendChild(createSvgElement("line", {
        class: "nutrient-track",
        x1: margin.left,
        x2: margin.left + innerWidth,
        y1: center,
        y2: center
      }));
      els.boxPlot.appendChild(createSvgElement("line", {
        class: "nutrient-range",
        x1: x(min),
        x2: x(groupMax),
        y1: center,
        y2: center,
        stroke: color
      }));
      const medianDot = createSvgElement("circle", {
        class: "nutrient-dot",
        cx: x(median),
        cy: center,
        r: 7,
        fill: color,
        tabindex: 0,
        role: "img",
        "aria-label": `${group.category} median ${metric.label}: ${formatValue(median, metric)}`
      });
      medianDot.addEventListener("mouseenter", (event) => showRangeTooltip(event, group, metric));
      medianDot.addEventListener("mousemove", moveTooltip);
      medianDot.addEventListener("mouseleave", hideTooltip);
      medianDot.addEventListener("focus", (event) => showRangeTooltip(event, group, metric));
      medianDot.addEventListener("blur", hideTooltip);
      els.boxPlot.appendChild(medianDot);
      const valueLabel = createSvgElement("text", {
        class: "value-label",
        x: Math.min(margin.left + innerWidth + 10, x(median) + 12),
        y: center + 4
      });
      valueLabel.textContent = formatValue(median, metric);
      els.boxPlot.appendChild(valueLabel);
    });

    const axisTitle = createSvgElement("text", {
      class: "plot-label",
      x: width / 2,
      y: height - 4,
      "text-anchor": "middle"
    });
    axisTitle.textContent = axisMetricLabel(metric);
    els.boxPlot.appendChild(axisTitle);
  }

  function renderAgeRecommendations() {
    const profile = ageProfiles[state.ageGroup];
    const recommendations = buildRecommendations(profile, 3);

    els.ageTitle.textContent = profile.title;
    els.ageDescription.textContent = profile.description;
    els.ageGroupImage.className = `age-illustration age-art ${profile.imageClass}`;
    els.ageGroupImage.setAttribute("aria-label", profile.imageAlt);
    els.recommendationTitle.textContent = `${profile.label} recommendations`;
    els.recommendationNote.textContent = profile.note;
    els.agePriorities.innerHTML = "";
    profile.priorities.forEach((priority) => {
      const item = document.createElement("li");
      item.textContent = priority;
      els.agePriorities.appendChild(item);
    });

    els.recommendationCards.innerHTML = "";
    recommendations.forEach((row) => {
      const card = document.createElement("article");
      card.className = "food-card";

      const heading = document.createElement("h4");
      heading.textContent = row.food_name;
      const category = document.createElement("p");
      category.textContent = row.category;
      const reason = document.createElement("p");
      reason.textContent = recommendationReason(row, profile);

      const list = document.createElement("dl");
      allMetrics.forEach((metric) => {
        const item = document.createElement("div");
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        dt.textContent = metric.label;
        dd.textContent = formatValue(row[metric.key], metric);
        item.append(dt, dd);
        list.appendChild(item);
      });

      card.append(heading, category, reason, list);
      els.recommendationCards.appendChild(card);
    });
  }

  function renderFoodVisuals(groups, metric) {
    if (!els.foodVisuals) return;
    const cards = groups.map((group) => {
      const visual = visualForCategory(group.category);
      const median = group.stats ? group.stats.median : 0;
      return {
        ...visual,
        category: group.category,
        summary: `${formatValue(median, metric)} median ${metric.label.toLowerCase()}`
      };
    });

    els.foodVisuals.innerHTML = "";
    cards.forEach((card) => {
      const article = document.createElement("article");
      article.className = "food-visual-card";
      const image = document.createElement("span");
      image.className = `food-art ${card.kind}`;
      image.setAttribute("role", "img");
      image.setAttribute("aria-label", card.alt);
      const text = document.createElement("div");
      const heading = document.createElement("h4");
      heading.textContent = card.category;
      const summary = document.createElement("p");
      summary.textContent = card.summary;
      text.append(heading, summary);
      article.append(image, text);
      els.foodVisuals.appendChild(article);
    });
  }

  function visualForCategory(category) {
    const name = category.toLowerCase();
    if (name.includes("juice") || name.includes("beverage") || name.includes("drink") || name.includes("cider")) {
      return { kind: "drink", alt: "Cartoon drink" };
    }
    if (name.includes("bread") || name.includes("roll") || name.includes("bagel")) {
      return { kind: "bread", alt: "Cartoon bread" };
    }
    if (name.includes("cake") || name.includes("pie") || name.includes("cobbler") || name.includes("crisp")) {
      return { kind: "dessert", alt: "Cartoon dessert" };
    }
    if (name.includes("chip") || name.includes("fried") || name.includes("fries") || name.includes("fast food")) {
      return { kind: "fried", alt: "Cartoon fried food" };
    }
    if (name.includes("dip") || name.includes("sauce") || name.includes("gravy") || name.includes("syrup") || name.includes("jam")) {
      return { kind: "sauce", alt: "Cartoon sauce" };
    }
    if (name.includes("sweet") || name.includes("candy")) {
      return { kind: "sweet", alt: "Cartoon sweets" };
    }
    if (name.includes("baked")) {
      return { kind: "baked", alt: "Cartoon baked food" };
    }
    if (name.includes("vegetable") || name.includes("onion") || name.includes("tomato") || name.includes("potato") || name.includes("fries")) {
      return { kind: "vegetable", alt: "Cartoon vegetables" };
    }
    return { kind: "fruit", alt: "Cartoon fruits" };
  }

  function axisMetricLabel(metric) {
    return metric.key === "calories" ? "Calories" : `${metric.label} (${metric.unit})`;
  }

  function buildRecommendations(profile, limit) {
    const selected = [];
    const seenCategories = new Set();
    const scored = shuffle(data
      .map((row) => ({ ...row, recommendationScore: scoreFood(row, profile) }))
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, Math.min(data.length, 36)));

    scored.forEach((row) => {
      if (selected.length >= limit) return;
      if (seenCategories.has(row.category)) return;
      selected.push(row);
      seenCategories.add(row.category);
    });

    if (selected.length < limit) {
      scored.forEach((row) => {
        if (selected.length >= limit) return;
        if (!selected.some((item) => item.id === row.id)) selected.push(row);
      });
    }

    return selected;
  }

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function scoreFood(row, profile) {
    const weights = profile.weights;
    let score = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      if (key === "caloriesTarget") score += weight * targetScore(row.calories, profile.calorieTarget);
      else if (key === "caloriesLow") score += weight * lowScore(row.calories, "calories");
      else if (key === "fatLow") score += weight * lowScore(row.fat, "fat");
      else score += weight * highScore(row[key], key);
    });

    // Small nudge toward foods that bring multiple nutrients, not just one standout number.
    score += 0.04 * highScore(row.protein, "protein");
    score += 0.03 * highScore(row.vitamin_c, "vitamin_c");
    return score;
  }

  function highScore(value, key) {
    const values = data.map((row) => row[key]).filter(Number.isFinite);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return (value - min) / (max - min || 1);
  }

  function lowScore(value, key) {
    return 1 - highScore(value, key);
  }

  function targetScore(value, target) {
    return Math.max(0, 1 - Math.abs(value - target) / target);
  }

  function recommendationReason(row, profile) {
    const strongest = [
      { key: "protein", label: "protein" },
      { key: "vitamin_c", label: "vitamin C" },
      { key: "iron", label: "iron" }
    ].sort((a, b) => highScore(row[b.key], b.key) - highScore(row[a.key], a.key))[0];

    if (profile.weights.caloriesLow && row.calories < profile.calorieTarget) {
      return `A lighter option with useful ${strongest.label} compared with many foods in the dataset.`;
    }
    if (profile.weights.fatLow && row.fat < 5) {
      return `Stands out for ${strongest.label} while keeping fat relatively low.`;
    }
    return `A strong fit because it contributes ${strongest.label} without relying on calories alone.`;
  }

  function summarize(values) {
    return {
      min: values[0],
      q1: quantile(values, 0.25),
      median: quantile(values, 0.5),
      q3: quantile(values, 0.75),
      max: values[values.length - 1]
    };
  }

  function quantile(values, q) {
    if (values.length === 1) return values[0];
    const position = (values.length - 1) * q;
    const base = Math.floor(position);
    const rest = position - base;
    return values[base + 1] === undefined
      ? values[base]
      : values[base] + rest * (values[base + 1] - values[base]);
  }

  function shortLabel(label, maxLength) {
    return label.length > maxLength ? `${label.slice(0, maxLength - 1)}...` : label;
  }

  function renderAll() {
    renderScatter();
    renderBoxPlot();
    renderAgeRecommendations();
  }

  function debounce(fn, delay) {
    let timer;
    return () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(fn, delay);
    };
  }

  initControls();
  renderAll();
})();
