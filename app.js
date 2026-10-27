"use strict";

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const presentation = $("#presentation");
  const stage = $("#scene-stage");
  let scenes = $$(".scene");
  const detailPanel = $("#detail-panel");
  const chapterDialog = $("#chapter-dialog");
  const imageDialog = $("#image-dialog");
  const imagePreview = $("#image-preview");
  const editorPanel = $("#editor-panel");
  const state = { index: 0, benefit: "analysis", traceStep: 0, learning: "first", imageZoom: false, editing: false, arranging: false, selectedImage: null };
  const storageKey = "vault-ekip-sunumu:editor:v1";
  const sceneElements = new Map(scenes.map(scene => [scene.id, scene]));
  const definitions = new Map();
  const extraInputs = new Map();
  const imageAssets = new Map();
  const failedImageIds = new Set();
  let imageDatabase = null;
  let imageBusy = "";
  let imageError = "";
  let imageGesture = null;
  let persistedImageIds = new Set();
  let imageOperationPending = false;
  let storageRevision = 0;
  let previewErrorMessage = "";
  let deck;
  let storageError = "";
  let unsaved = false;
  let storageConflict = false;
  let hasSaved = false;
  let detailReturnFocus = null;
  let redrawFrame = 0;
  let feedbackTimer = 0;

  const details = {
    problem: {
      title: "Tekrarlanan işler",
      blocks: [
        { items: ["Agentın projeyi tanıması için aynı açıklamaları yeniden veriyoruz.", "Benzer bir sorun daha önce incelenmiş olsa da o bilgi başka bir kişide veya oturumda kalabiliyor.", "Mimari kararları ve geliştirme kurallarını herkesin agentına ayrı ayrı aktarmak gerekiyor."] }
      ]
    },
    solution: {
      title: "Mevcut vault’ta ne var?",
      blocks: [
        { items: ["CRM/ITTP, CrmWeb, CSI ve Bumerang için proje ve mimari notları.", "Geliştirme standartları, teknik kararlar, karşılaşılan sorunlar ve çözümleri.", "İlgili notlara ve kaynak dosyalara yönlendiren bağlantılar."] },
        { heading: "Görsel", items: ["Ekrandaki grafik, kendi kullandığım vault’un Obsidian görünümü. Örnek olarak üretilmiş bir grafik değil."] }
      ]
    },
    benefits: {
      title: "Tasarruf nereden geliyor?",
      blocks: [
        { items: ["Agent, proje bilgisini edinmek için her seferinde geniş bir kod taraması yapmak yerine ilgili nottan başlayabiliyor.", "İlgili kaynak dosyayı daha erken bulduğu için tekrarlanan okuma ve açıklama azalıyor.", "Standartlar ve geçmiş çözümler ortak kaynaktan kullanılabiliyor."] },
        { heading: "Token", items: ["Token, modelin okuduğu ve ürettiği metnin hesaplandığı birimdir. Gereksiz tekrarları azaltmak bu kullanımı da azaltabilir.", "Sunumda ölçülmüş bir tasarruf oranı verilmiyor. Karşılaştırma işleyişi açıklıyor."] }
      ]
    },
    usage: {
      title: "Ekran görüntüsündeki sıra",
      blocks: [
        { items: ["CRM/ITTP giriş notu okunuyor.", "Aramayla Neo satış hatasına ait not bulunup okunuyor.", "Notun işaret ettiği IspBSTemp.cs dosyasında ilgili hata kodları inceleniyor."] },
        { heading: "Burada gösterilen", items: ["Agentın vault’tan başlayıp ilgili kaynak koda geçmesi. Görsel, hatanın çözüldüğünü göstermiyor."] }
      ],
      sources: ["40-CRM-ITTP-Solution-ve-Proje-Haritasi.md", "60-Neo-Satisi-Aktif-Uydu-Engeli.md", "IspBSTemp.cs"]
    },
    learning: {
      title: "Çözümün sonraki işte kullanılması",
      blocks: [
        { items: ["Çözülen sorun için vault’ta kaynak yoksa agent çözümü yeni bir .md notuyla kaydediyor.", "Çözüm ve ilgili kaynaklar, o sohbetin dışında da kullanılabilir hâle geliyor.", "Vault ortak kullanıma açıldığında başka bir ekip üyesinin agentı da bu nota ulaşabilir."] },
        { heading: "Kayıt", items: ["Çözümün hangi dosya veya yöntemle ilgili olduğu yazılmalı. Öneri ile gerçekten uygulanmış çözüm birbirine karıştırılmamalı."] }
      ]
    },
    team: {
      title: "Ekibe açmak için",
      blocks: [
        { items: ["Mevcut vault’u ekibin erişebileceği ortak yapıya taşımak.", "Notları senkron tutmak ve herkesin agentını bu klasöre yönlendirmek.", "Yeni çözümleri ortak notlara eklemek; değişiklikleri ekip içinde kontrol etmek."] },
        { heading: "Senkronizasyon ve maliyet", items: ["Obsidian Sync kullanmayı planlıyorum.", "Maildeki ilk tahmin, yıllık abonelikte kullanıcı başına aylık yaklaşık $4. Güncel fiyat ve ortak vault kapsamı ayrıca doğrulanmalı."] },
        { heading: "Paylaşım", items: ["Erişim, yetkili CRM ekibiyle sınırlı olmalı. Sır ve müşteri bilgileri ortak notlara alınmamalı."] }
      ]
    }
  };

  const benefits = {
    analysis: { task: "İlgili servisi bulmak", without: ["Kodda ara", "Bağlantıları bul"], with: ["İlgili notu oku", "Kaynak dosyaya git"] },
    development: { task: "Proje kurallarını uygulamak", without: ["Kuralları ayrı ayrı aktar", "Açıklamayı tekrar et"], with: ["Ortak standart notunu oku", "Geliştirmede uygula"] },
    issue: { task: "Benzer bir hatayı incelemek", without: ["Önceki çalışmayı ara", "İncelemeyi tekrarla"], with: ["Çözüm notunu bul", "İlgili koda geç"] }
  };
  const traceSteps = [
    { top: 0, height: 24, text: "Önce CRM/ITTP giriş notu okunmuş." },
    { top: 26, height: 33, text: "İlgili Neo hata notu bulunmuş." },
    { top: 60, height: 40, text: "IspBSTemp.cs dosyasına geçilmiş." }
  ];
  const learningSteps = {
    first: {
      start: ["Sorun", "Vault’ta çözümü yok"],
      work: ["Çözüm bulunur", "İlgili kod incelenir"],
      note: ["Yeni .md notu", "Agent çözümü yazar"],
      result: ["Vault", "Çözüm saklanır"]
    },
    next: {
      start: ["Benzer sorun", "Başka bir görev"],
      work: ["Çözüm notu", "Önceki kayıt okunur"],
      note: ["İlgili kod", "Notun gösterdiği dosya"],
      result: ["Yeni çalışma", "Önceki bilgi kullanılır"]
    }
  };
  const images = {
    vault: { src: "assets\\vault-graph.png", title: "Mevcut vault", alt: "Obsidian'daki gerçek vault grafiği: teknik notlar ve aralarındaki bağlantılar." },
    agent: { src: "assets\\agent-vault.png", title: "Agentın vault kullanımı", alt: "Gerçek agent oturumu: CRM/ITTP notu, Neo hata notu ve IspBSTemp.cs kaynak dosyasına geçiş." }
  };

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function notify(message) {
    clearTimeout(feedbackTimer);
    $("#feedback").textContent = message;
    $("#feedback").hidden = false;
    feedbackTimer = setTimeout(() => { $("#feedback").hidden = true; }, 6000);
  }

  function openDetails(key, trigger) {
    if (state.editing) {
      if (state.arranging) setArrangement(false, false);
      $("#editor-notes-group").open = true;
      $("input", $("#editor-notes-fields")).focus();
      return;
    }
    const content = deck.slides[trigger.closest(".scene").id].notes;
    if (!content) throw new Error(`Bölüm notu bulunamadı: ${key}`);
    detailReturnFocus = trigger;
    $("#detail-title").textContent = content.title.trim() || "Bölüm notları";
    const body = $("#detail-content");
    body.replaceChildren();
    for (const block of content.blocks) {
      const section = createElement("section", "detail-block");
      if (block.heading) section.append(createElement("h3", "", block.heading));
      const list = createElement("ul");
      for (const item of block.items) list.append(createElement("li", "", item));
      section.append(list);
      body.append(section);
    }
    if (content.sources.length) {
      const sources = createElement("div", "detail-sources");
      sources.append(createElement("span", "", "Görseldeki dosyalar"));
      for (const source of content.sources) sources.append(createElement("code", "", source));
      body.append(sources);
    }
    detailPanel.hidden = false;
    presentation.dataset.panelOpen = "true";
    $$("[data-detail]").forEach(button => button.setAttribute("aria-expanded", String(button === trigger)));
    $("#detail-title").focus({ preventScroll: true });
    $(".detail-scroll").scrollTop = 0;
    queueDraw();
  }

  function closeDetails(restoreFocus = true) {
    if (detailPanel.hidden) return;
    detailPanel.hidden = true;
    presentation.dataset.panelOpen = "false";
    $$("[data-detail]").forEach(button => button.setAttribute("aria-expanded", "false"));
    if (restoreFocus && detailReturnFocus && !detailReturnFocus.closest("[hidden]")) detailReturnFocus.focus({ preventScroll: true });
    queueDraw();
  }

  function showScene(index, options = {}) {
    if (index < 0 || index >= scenes.length) return;
    finishImageGesture(false);
    closeDetails(false);
    clearTimeout(feedbackTimer);
    $("#feedback").hidden = true;
    state.index = index;
    state.selectedImage = null;
    scenes.forEach((scene, position) => { scene.hidden = position !== index; });
    const current = scenes[index];
    refreshNavigation();
    renderEditor();
    refreshImageSelection();
    stage.scrollTop = 0;
    $("#announcement").textContent = `${index + 1} / ${scenes.length}. ${current.dataset.title}`;
    if (options.updateHash !== false) history.replaceState(null, "", `#${current.id}`);
    if (options.focus) {
      const target = state.editing && !stage.getClientRects().length ? $("#editor-title") : $("h2", current);
      target.focus({ preventScroll: true });
    }
    queueDraw();
  }

  function refreshNavigation() {
    const current = scenes[state.index];
    $("#section-index").textContent = String(state.index + 1).padStart(2, "0");
    $("#section-name").textContent = current.dataset.section;
    $("#scene-counter").textContent = `${String(state.index + 1).padStart(2, "0")} / ${String(scenes.length).padStart(2, "0")}`;
    $("#previous-scene").disabled = state.index === 0;
    $("#next-scene").disabled = state.index === scenes.length - 1;
    $$("[data-scene-index]").forEach(button => {
      const position = Number(button.dataset.sceneIndex);
      const title = scenes[position].dataset.title;
      if (position === state.index) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
      button.classList.toggle("is-past", position < state.index);
      if (button.classList.contains("progress-step")) {
        button.title = title;
        button.setAttribute("aria-label", `${position + 1}. ${title}`);
      } else {
        $("strong", button).textContent = title;
      }
    });
    const progress = $("#progress-steps");
    const active = $('[aria-current="step"]', progress);
    if (active) {
      const box = active.getBoundingClientRect();
      const bounds = progress.getBoundingClientRect();
      if (box.left < bounds.left) progress.scrollLeft += box.left - bounds.left;
      else if (box.right > bounds.right) progress.scrollLeft += box.right - bounds.right;
    }
  }

  function buildNavigation() {
    $("#progress-steps").replaceChildren();
    $("#chapter-list").replaceChildren();
    scenes.forEach((scene, index) => {
      const progress = createElement("button", "progress-step");
      progress.type = "button";
      progress.dataset.sceneIndex = String(index);
      progress.setAttribute("aria-label", `${index + 1}. ${scene.dataset.title}`);
      progress.title = scene.dataset.title;
      progress.addEventListener("click", () => showScene(index));
      $("#progress-steps").append(progress);
      const chapter = createElement("button", "chapter-item");
      chapter.type = "button";
      chapter.dataset.sceneIndex = String(index);
      chapter.append(createElement("span", "", String(index + 1).padStart(2, "0")), createElement("strong", "", scene.dataset.title));
      chapter.addEventListener("click", () => {
        chapterDialog.close();
        showScene(index, { focus: true });
      });
      $("#chapter-list").append(chapter);
    });
  }

  function updateBenefit(key) {
    const example = benefits[key];
    if (!example) throw new Error(`İş örneği bulunamadı: ${key}`);
    state.benefit = key;
    $$("[data-benefit]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.benefit === key)));
    renderSceneTexts("avantajlar");
    refreshEditorExtras("avantajlar");
    $("#announcement").textContent = `${$("#benefit-task").textContent}. ${$("#with-first").textContent}, ${$("#with-second").textContent}.`;
  }

  function updateTrace(index) {
    const step = traceSteps[index];
    if (!step) throw new Error(`Oturum adımı bulunamadı: ${index}`);
    state.traceStep = index;
    $$("[data-trace-step]").forEach(button => button.setAttribute("aria-pressed", String(Number(button.dataset.traceStep) === index)));
    const frame = $(".trace-frame");
    frame.dataset.tracePosition = String(index);
    frame.style.setProperty("--focus-top", `${step.top}%`);
    frame.style.setProperty("--focus-height", `${step.height}%`);
    renderSceneTexts("benim-kullanimim");
    refreshEditorExtras("benim-kullanimim");
  }

  function updateLearning(key) {
    const steps = learningSteps[key];
    if (!steps) throw new Error(`Çözüm akışı bulunamadı: ${key}`);
    state.learning = key;
    $$("[data-learning]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.learning === key)));
    renderSceneTexts("cozumun-kaydi");
    refreshEditorExtras("cozumun-kaydi");
    $("#announcement").textContent = $$(".learning-map .node").map(node => node.textContent).join(". ");
    queueDraw();
  }

  function fitImage() {
    if (!imageDialog.open || !imagePreview.naturalWidth || imagePreview.hidden) return;
    const canvas = $("#image-canvas");
    const ratio = imagePreview.naturalWidth / imagePreview.naturalHeight;
    const width = state.imageZoom ? imagePreview.naturalWidth * 2 : Math.min(imagePreview.naturalWidth, canvas.clientWidth, canvas.clientHeight * ratio);
    imagePreview.style.width = `${Math.max(1, width)}px`;
  }

  function openImage(key) {
    const image = images[key];
    if (!image) throw new Error(`Ekran görüntüsü bulunamadı: ${key}`);
    showImage(image, "Görsel açılamadı. Sunumun assets klasörünü de aynı konumda tutun.");
  }

  function showImage(image, errorMessage) {
    previewErrorMessage = errorMessage;
    state.imageZoom = false;
    $("#image-zoom").setAttribute("aria-pressed", "false");
    $("#image-zoom").disabled = true;
    $("#image-canvas").classList.remove("is-zoomed");
    $("#image-title").textContent = image.title;
    $("#image-error").hidden = true;
    imagePreview.hidden = false;
    imagePreview.alt = image.alt;
    imagePreview.src = image.src;
    imageDialog.showModal();
    $("#image-canvas").scrollTo(0, 0);
    fitImage();
  }

  imagePreview.addEventListener("load", () => {
    $("#image-zoom").disabled = false;
    fitImage();
  });
  imagePreview.addEventListener("error", () => {
    imagePreview.hidden = true;
    $("#image-zoom").disabled = true;
    $("#image-error").hidden = false;
    $("#image-error").textContent = previewErrorMessage;
  });
  $("#image-zoom").addEventListener("click", () => {
    state.imageZoom = !state.imageZoom;
    $("#image-zoom").setAttribute("aria-pressed", String(state.imageZoom));
    $("#image-canvas").classList.toggle("is-zoomed", state.imageZoom);
    $("#image-canvas").scrollTo(0, 0);
    fitImage();
  });

  function graphEdges(name) {
    if (name === "problem") return ["code", "messages", "docs", "notes"].map(from => ({ from, to: "query", broken: true }));
    if (name === "learning") return [{ from: "start", to: "work" }, { from: "work", to: "note", active: true }, { from: "note", to: "result", active: true }];
    if (name === "team") return ["agent-a", "agent-b", "agent-c"].map(to => ({ from: "vault", to }));
    throw new Error(`Diyagram bulunamadı: ${name}`);
  }

  function svgElement(tag, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
    return element;
  }

  function nodeBox(node, origin) {
    const bounds = node.getBoundingClientRect();
    return { x: bounds.x - origin.x, y: bounds.y - origin.y, width: bounds.width, height: bounds.height };
  }

  function anchor(box, side) {
    const midX = box.x + box.width / 2;
    const midY = box.y + box.height / 2;
    const padding = 6;
    if (side === "left") return { x: box.x - padding, y: midY, dx: -1, dy: 0 };
    if (side === "right") return { x: box.x + box.width + padding, y: midY, dx: 1, dy: 0 };
    if (side === "top") return { x: midX, y: box.y - padding, dx: 0, dy: -1 };
    return { x: midX, y: box.y + box.height + padding, dx: 0, dy: 1 };
  }

  function edgePath(from, to) {
    const deltaX = to.x + to.width / 2 - from.x - from.width / 2;
    const deltaY = to.y + to.height / 2 - from.y - from.height / 2;
    const horizontalGap = deltaX > 0 ? to.x - from.x - from.width : from.x - to.x - to.width;
    const verticalGap = deltaY > 0 ? to.y - from.y - from.height : from.y - to.y - to.height;
    const horizontal = horizontalGap > verticalGap;
    const start = anchor(from, horizontal ? (deltaX > 0 ? "right" : "left") : (deltaY > 0 ? "bottom" : "top"));
    const end = anchor(to, horizontal ? (deltaX > 0 ? "left" : "right") : (deltaY > 0 ? "top" : "bottom"));
    const distance = Math.min(90, Math.max(20, Math.hypot(end.x - start.x, end.y - start.y) * .38));
    return `M ${start.x} ${start.y} C ${start.x + start.dx * distance} ${start.y + start.dy * distance}, ${end.x + end.dx * distance} ${end.y + end.dy * distance}, ${end.x} ${end.y}`;
  }

  function drawGraph(graph) {
    if (!graph.clientWidth || graph.closest("[hidden]")) return;
    const svg = $(".connector-layer", graph);
    const bounds = graph.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
    svg.replaceChildren();
    const defs = svgElement("defs");
    for (const mode of ["normal", "active"]) {
      const marker = svgElement("marker", { id: `arrow-${graph.dataset.graph}-${mode}`, viewBox: "0 0 8 8", refX: 7, refY: 4, markerWidth: 5, markerHeight: 5, orient: "auto-start-reverse" });
      marker.append(svgElement("path", { d: "M 1 1 L 7 4 L 1 7", fill: "none", stroke: mode === "active" ? "#53d3c4" : "#41536e", "stroke-width": 1.2 }));
      defs.append(marker);
    }
    svg.append(defs);
    for (const edge of graphEdges(graph.dataset.graph)) {
      const from = $(`[data-node="${edge.from}"]`, graph);
      const to = $(`[data-node="${edge.to}"]`, graph);
      if (!from || !to) throw new Error(`Diyagram düğümü bulunamadı: ${edge.from} → ${edge.to}`);
      svg.append(svgElement("path", {
        d: edgePath(nodeBox(from, bounds), nodeBox(to, bounds)),
        class: `edge${edge.active ? " is-active" : ""}${edge.broken ? " is-broken" : ""}`,
        "marker-end": `url(#arrow-${graph.dataset.graph}-${edge.active ? "active" : "normal"})`
      }));
    }
  }

  function queueDraw() {
    cancelAnimationFrame(redrawFrame);
    redrawFrame = requestAnimationFrame(() => {
      $$("[data-graph]").forEach(drawGraph);
      layoutAddedImages();
    });
  }

  function createDefaultDeck() {
    const result = { format: "vault-ekip-sunumu", version: 2, order: scenes.map(scene => scene.id), slides: {} };
    const groups = [
      [".node-title:not([id])", "node-title", "Düğüm başlığı"],
      [".node-meta:not([id])", "node-meta", "Düğüm açıklaması"],
      [".node-kind", "node-kind", "Düğüm etiketi"],
      [".lane-label", "lane", "Karşılaştırma etiketi"],
      [".segmented button", "option", "Seçenek adı"],
      [".trace-label", "step-label", "Adım adı"],
      [".screen-figure figcaption > span", "caption", "Görsel açıklaması"],
      [".scene-footnote", "footnote", "Dipnot"]
    ];
    function addField(id, key, element, label, value, active = () => true) {
      definitions.get(id).fields.push({ key, element, label, active });
      result.slides[id].texts[key] = value;
      if (!element.closest("button")) element.dataset.editorTarget = "extra";
    }
    for (const scene of scenes) {
      const source = details[$("[data-detail]", scene).dataset.detail];
      const points = $$(".slide-points > li", scene);
      definitions.set(scene.id, {
        fields: [],
        pointTemplates: new Map(points.map(item => [item.textContent, item.cloneNode(true)]))
      });
      result.slides[scene.id] = {
        kind: "original",
        title: $("h2", scene).textContent,
        section: scene.dataset.section,
        points: points.map(item => item.textContent),
        texts: {},
        images: [],
        notes: {
          title: source.title,
          blocks: source.blocks.map(block => ({ heading: block.heading || "", items: [...block.items] })),
          sources: source.sources ? [...source.sources] : []
        }
      };
      for (const [selector, key, label] of groups) {
        $$(selector, scene).forEach((element, index) => {
          addField(scene.id, `${key}-${index}`, element, `${label} ${index + 1}`, element.textContent);
        });
      }
    }
    for (const [key, example] of Object.entries(benefits)) {
      const fields = [
        ["task", "#benefit-task", "İş örneğinin başlığı", example.task],
        ["without-0", "#without-first", "Her seferinde: ilk adım", example.without[0]],
        ["without-1", "#without-second", "Her seferinde: ikinci adım", example.without[1]],
        ["with-0", "#with-first", "Vault ile: ilk adım", example.with[0]],
        ["with-1", "#with-second", "Vault ile: ikinci adım", example.with[1]]
      ];
      for (const [name, selector, label, text] of fields) {
        addField("avantajlar", `benefit-${key}-${name}`, $(selector), label, text, () => state.benefit === key);
      }
    }
    traceSteps.forEach((step, index) => {
      addField("benim-kullanimim", `trace-${index}`, $("#trace-result"), "Seçili adımın açıklaması", step.text, () => state.traceStep === index);
    });
    for (const [key, steps] of Object.entries(learningSteps)) {
      for (const [name, values] of Object.entries(steps)) {
        addField("cozumun-kaydi", `learning-${key}-${name}`, $(`#learning-${name}`), "Akış: düğüm başlığı", values[0], () => state.learning === key);
        addField("cozumun-kaydi", `learning-${key}-${name}-meta`, $(`#learning-${name}-meta`), "Akış: düğüm açıklaması", values[1], () => state.learning === key);
      }
    }
    return result;
  }

  function validateDeck(value) {
    const isRecord = item => item !== null && typeof item === "object" && !Array.isArray(item);
    function requireValue(condition, message) {
      if (!condition) throw new Error(message);
    }
    function text(item) {
      requireValue(typeof item === "string", "Yedekteki bir metin alanı geçersiz.");
      return item;
    }
    function lines(items) {
      requireValue(Array.isArray(items), "Yedekteki satır listesi geçersiz.");
      return items.map(text);
    }
    requireValue(isRecord(value) && value.format === "vault-ekip-sunumu" && [1, 2].includes(value.version), "Bu dosya desteklenen bir sunum yedeği değil.");
    requireValue(isRecord(value.slides), "Yedekte slaytlar bulunamadı.");
    const order = lines(value.order);
    requireValue(order.length > 0 && new Set(order).size === order.length, "Slayt sırası boş veya tekrarlı.");
    const result = { format: value.format, version: 2, order, slides: {} };
    const imageIds = new Set();
    for (const id of definitions.keys()) {
      requireValue(Object.hasOwn(value.slides, id), "Yedekte özgün sunum bilgileri eksik.");
    }
    for (const [id, slide] of Object.entries(value.slides)) {
      const original = definitions.has(id);
      requireValue(original || /^slide-[a-z0-9-]+$/.test(id), "Yedekteki slayt kimliği geçersiz.");
      requireValue(isRecord(slide) && slide.kind === (original ? "original" : "text"), "Yedekteki slayt türü geçersiz.");
      requireValue(original || order.includes(id), "Yedekte sırası olmayan bir slayt var.");
      requireValue(isRecord(slide.texts), "Yedekteki diyagram yazıları geçersiz.");
      const expected = original ? definitions.get(id).fields.map(field => field.key) : [];
      requireValue(Object.keys(slide.texts).length === expected.length && expected.every(key => Object.hasOwn(slide.texts, key)), "Yedekteki yazı alanları bu sürümle uyuşmuyor.");
      const texts = {};
      for (const key of expected) texts[key] = text(slide.texts[key]);
      requireValue(isRecord(slide.notes) && Array.isArray(slide.notes.blocks) && slide.notes.blocks.length > 0, "Yedekteki bölüm notları geçersiz.");
      const notes = {
        title: text(slide.notes.title),
        blocks: slide.notes.blocks.map(block => {
          requireValue(isRecord(block), "Yedekteki not grubu geçersiz.");
          return { heading: text(block.heading), items: lines(block.items) };
        }),
        sources: lines(slide.notes.sources)
      };
      const sourceImages = value.version === 1 ? [] : slide.images;
      requireValue(Array.isArray(sourceImages), "Yedekteki görsel listesi geçersiz.");
      const placedImages = sourceImages.map(image => {
        requireValue(isRecord(image) && typeof image.id === "string" && /^image-[a-z0-9-]+$/.test(image.id) && !imageIds.has(image.id), "Yedekteki görsel kimliği geçersiz veya tekrarlı.");
        imageIds.add(image.id);
        for (const key of ["x", "y", "width"]) {
          requireValue(Number.isFinite(image[key]) && image[key] >= (key === "width" ? .03 : 0) && image[key] <= 1, "Yedekteki görsel konumu veya boyutu geçersiz.");
        }
        requireValue(Number.isInteger(image.naturalWidth) && image.naturalWidth > 0 && Number.isInteger(image.naturalHeight) && image.naturalHeight > 0, "Yedekteki görsel ölçüleri geçersiz.");
        return { id: image.id, name: text(image.name), alt: text(image.alt), x: image.x, y: image.y, width: image.width, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight };
      });
      result.slides[id] = { kind: slide.kind, title: text(slide.title), section: text(slide.section), points: lines(slide.points), texts, notes, images: placedImages };
    }
    requireValue(order.every(id => Object.hasOwn(result.slides, id)), "Slayt sırasındaki bir slayt bulunamadı.");
    return result;
  }

  function loadDeck(defaultValue) {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const restored = validateDeck(JSON.parse(saved));
        hasSaved = true;
        return restored;
      }
    } catch (error) {
      storageError = `Kayıt okunamadı; ilk sunum açıldı. ${error.message}`;
    }
    return structuredClone(defaultValue);
  }

  function updateSaveStatus() {
    const status = $("#editor-save-status");
    const message = storageError || imageError || imageBusy || (hasSaved ? "Bu tarayıcıda kaydedildi." : "Değişiklikler bu tarayıcıda saklanır.");
    if (status.textContent !== message) status.textContent = message;
    status.dataset.state = storageError || imageError ? "error" : imageBusy ? "busy" : "saved";
  }

  function saveDeck() {
    unsaved = true;
    try {
      if (storageConflict) throw new Error("Başka bir sekmede değişiklik var. Bu sekmenin yedeğini indirip sayfayı yenile.");
      localStorage.setItem(storageKey, JSON.stringify(deck));
      const currentIds = new Set(allAddedImages().map(image => image.id));
      const removedIds = [...persistedImageIds].filter(id => !currentIds.has(id));
      persistedImageIds = currentIds;
      if (removedIds.length) removeStoredImages(removedIds);
      storageError = "";
      unsaved = false;
      hasSaved = true;
    } catch (error) {
      const message = `Kaydedilemedi. Yedek indirerek değişiklikleri koru. ${error.message}`;
      if (storageError !== message) notify(message);
      storageError = message;
    }
    updateSaveStatus();
    return !unsaved;
  }

  function createTextScene(id) {
    const scene = createElement("section", "scene text-scene");
    scene.id = id;
    scene.hidden = true;
    const heading = createElement("div", "scene-heading");
    const title = createElement("h2");
    title.id = `title-${id}`;
    title.tabIndex = -1;
    scene.setAttribute("aria-labelledby", title.id);
    const notesButton = $("[data-detail]", sceneElements.get("sorun")).cloneNode(true);
    notesButton.dataset.detail = id;
    notesButton.setAttribute("aria-expanded", "false");
    heading.append(title, notesButton);
    scene.append(heading, createElement("ul", "slide-points"));
    sceneElements.set(id, scene);
    return scene;
  }

  function renderSceneTexts(id) {
    const definition = definitions.get(id);
    if (!definition) return;
    for (const field of definition.fields) {
      if (!field.active()) continue;
      const text = deck.slides[id].texts[field.key];
      if (field.element.textContent !== text) field.element.textContent = text;
      field.element.dataset.editorField = field.key;
    }
  }

  function renderSlide(id) {
    const slide = deck.slides[id];
    const scene = sceneElements.get(id);
    const title = slide.title.trim() || "Başlıksız slayt";
    $("h2", scene).textContent = title;
    $("h2", scene).dataset.editorTarget = "title";
    scene.dataset.title = title;
    scene.dataset.section = slide.section;
    const list = $(".slide-points", scene);
    list.dataset.editorTarget = "points";
    list.replaceChildren();
    const templates = definitions.get(id);
    for (const point of slide.points) {
      // Unchanged lines keep the original emphasis and code formatting.
      const template = templates && templates.pointTemplates.get(point);
      list.append(template ? template.cloneNode(true) : createElement("li", "", point));
    }
    renderSceneTexts(id);
    renderAddedImages(id);
  }

  function renderDeck() {
    for (const [id, element] of sceneElements) {
      element.hidden = true;
      if (!Object.hasOwn(deck.slides, id)) {
        imageLayoutObserver.unobserve(element);
        element.remove();
        sceneElements.delete(id);
      }
    }
    for (const id of Object.keys(deck.slides)) {
      if (!sceneElements.has(id)) createTextScene(id);
      renderSlide(id);
    }
    scenes = deck.order.map(id => sceneElements.get(id));
    scenes.forEach(scene => stage.append(scene));
    buildNavigation();
  }

  function currentSlide() {
    return deck.slides[scenes[state.index].id];
  }

  function splitLines(value) {
    return value === "" ? [] : value.replace(/\r\n?/g, "\n").split("\n");
  }

  function changeCurrentSlide(change) {
    change(currentSlide());
    renderSlide(scenes[state.index].id);
    refreshNavigation();
    updateWordCount();
    saveDeck();
    queueDraw();
  }

  function addEditorField(parent, labelText, value, change, multiline = false) {
    const label = createElement("label", "editor-field");
    const input = createElement(multiline ? "textarea" : "input");
    if (multiline) input.rows = 3;
    else input.type = "text";
    input.value = value;
    input.autocomplete = "off";
    input.addEventListener("input", () => changeCurrentSlide(slide => change(slide, input.value)));
    label.append(createElement("span", "", labelText), input);
    parent.append(label);
    return input;
  }

  function renderExtraFields() {
    const id = scenes[state.index].id;
    const body = $("#editor-extra-fields");
    body.replaceChildren();
    extraInputs.clear();
    const definition = definitions.get(id);
    const fields = definition ? definition.fields.filter(field => field.active()) : [];
    $("#editor-extra-group").hidden = fields.length === 0;
    for (const field of fields) {
      const input = addEditorField(body, field.label, currentSlide().texts[field.key], (slide, value) => { slide.texts[field.key] = value; });
      input.dataset.fieldKey = field.key;
      extraInputs.set(field.key, input);
    }
  }

  function refreshEditorExtras(id) {
    if (!state.editing || scenes[state.index].id !== id) return;
    renderExtraFields();
    updateWordCount();
  }

  function renderEditorNotes() {
    const notes = currentSlide().notes;
    const body = $("#editor-notes-fields");
    body.replaceChildren();
    addEditorField(body, "Not panelinin başlığı", notes.title, (slide, value) => { slide.notes.title = value; });
    notes.blocks.forEach((block, index) => {
      addEditorField(body, `Not grubu ${index + 1}: ara başlık (isteğe bağlı)`, block.heading, (slide, value) => { slide.notes.blocks[index].heading = value; });
      addEditorField(body, `Not grubu ${index + 1}: her satır bir madde`, block.items.join("\n"), (slide, value) => { slide.notes.blocks[index].items = splitLines(value); }, true);
    });
    addEditorField(body, "Kaynak dosyalar (her satır bir dosya)", notes.sources.join("\n"), (slide, value) => { slide.notes.sources = splitLines(value).filter(line => line.trim()); }, true);
  }

  function updateWordCount() {
    if (!state.editing) return;
    const parts = [];
    const walker = document.createTreeWalker(scenes[state.index], NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest("[data-diagram-label], svg, [aria-hidden='true'], .sr-only, [hidden]")) continue;
      parts.push(node.textContent);
    }
    const count = parts.join(" ").split(/\s+/).filter(word => /[\p{L}\p{N}]/u.test(word)).length;
    $("#editor-word-count").textContent = `${count} kelime${count > 45 ? " — uzun ayrıntıları bölüm notlarına taşıyabilirsin." : " · önerilen üst sınır 45."}`;
    $("#editor-word-count").dataset.long = String(count > 45);
  }

  function renderEditor() {
    if (!state.editing) return;
    const slide = currentSlide();
    $("#editor-title").value = slide.title;
    $("#editor-section").value = slide.section;
    $("#editor-points").value = slide.points.join("\n");
    $("#editor-move-back").disabled = state.index === 0;
    $("#editor-move-forward").disabled = state.index === scenes.length - 1;
    $("#editor-delete-slide").disabled = scenes.length === 1;
    renderExtraFields();
    renderEditorNotes();
    renderImageEditor();
    updateWordCount();
  }

  function setEditing(enabled) {
    finishImageGesture(false);
    closeDetails(false);
    state.editing = enabled;
    state.arranging = false;
    presentation.dataset.imageArrange = "false";
    $("#image-layout-done").hidden = true;
    editorPanel.hidden = !enabled;
    presentation.dataset.editorOpen = String(enabled);
    $("#edit-toggle").setAttribute("aria-pressed", String(enabled));
    $("#edit-toggle span").textContent = enabled ? "Bitir" : "Düzenle";
    $(".skip-link").textContent = enabled ? "Düzenleme alanına geç" : "Ana sahneye geç";
    $(".skip-link").href = enabled ? "#editor-title" : "#scene-stage";
    renderEditor();
    refreshImageSelection();
    if (enabled) $("#editor-title").focus();
    else {
      clearTimeout(feedbackTimer);
      $("#feedback").hidden = true;
      $("#edit-toggle").focus({ preventScroll: true });
      if (unsaved) notify("Değişiklikler henüz kaydedilmedi. Düzenle panelinden yedek indir.");
    }
    queueDraw();
  }

  function refreshDeck(targetId) {
    renderDeck();
    const index = deck.order.indexOf(targetId);
    showScene(index < 0 ? 0 : index);
    saveDeck();
  }

  function addSlide() {
    const id = `slide-${crypto.randomUUID()}`;
    deck.slides[id] = {
      kind: "text", title: "Yeni slayt", section: "Yeni bölüm", points: ["Yeni madde"], texts: {}, images: [],
      notes: { title: "Bölüm notları", blocks: [{ heading: "", items: [] }], sources: [] }
    };
    deck.order.splice(state.index + 1, 0, id);
    refreshDeck(id);
    $("#editor-title").focus();
    $("#editor-title").select();
    $(".editor-scroll").scrollTop = 0;
  }

  function moveSlide(direction) {
    const destination = state.index + direction;
    if (destination < 0 || destination >= scenes.length) return;
    const id = deck.order[state.index];
    deck.order.splice(state.index, 1);
    deck.order.splice(destination, 0, id);
    refreshDeck(id);
  }

  function deleteSlide() {
    if (scenes.length === 1) {
      notify("Sunumda en az bir slayt kalmalı.");
      return;
    }
    const id = scenes[state.index].id;
    if (!confirm(`“${scenes[state.index].dataset.title}” slaytı silinsin mi?`)) return;
    deck.order.splice(state.index, 1);
    if (deck.slides[id].kind === "text") delete deck.slides[id];
    refreshDeck(deck.order[Math.min(state.index, deck.order.length - 1)]);
    $("#editor-title").focus();
  }

  function allAddedImages(source = deck) {
    return Object.values(source.slides).flatMap(slide => slide.images);
  }

  function openImageDatabase() {
    if (imageDatabase) return imageDatabase;
    imageDatabase = new Promise((resolve, reject) => {
      const request = indexedDB.open("vault-ekip-sunumu-images", 1);
      let failed = false;
      request.onupgradeneeded = () => request.result.createObjectStore("images", { keyPath: "id" });
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        failed = true;
        reject(new Error("Görsel deposu başka bir sekme tarafından kullanılıyor. Diğer sunum sekmelerini kapat."));
      };
      request.onsuccess = () => {
        const database = request.result;
        if (failed) { database.close(); return; }
        database.onversionchange = () => { database.close(); imageDatabase = null; };
        resolve(database);
      };
    }).catch(error => { imageDatabase = null; throw error; });
    return imageDatabase;
  }

  async function writeImageAssets(assets) {
    const database = await openImageDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction("images", "readwrite");
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(transaction.error || new Error("Görsel kaydı tamamlanamadı."));
      try {
        for (const asset of assets) transaction.objectStore("images").add(asset);
      } catch (error) {
        transaction.abort();
        reject(error);
      }
    });
  }

  async function removeStoredImages(ids) {
    try {
      const database = await openImageDatabase();
      await new Promise((resolve, reject) => {
        const transaction = database.transaction("images", "readwrite");
        transaction.oncomplete = resolve;
        transaction.onabort = () => reject(transaction.error || new Error("Eski görseller temizlenemedi."));
        for (const id of ids) transaction.objectStore("images").delete(id);
      });
      for (const id of ids) {
        const asset = imageAssets.get(id);
        if (asset) URL.revokeObjectURL(asset.url);
        imageAssets.delete(id);
        failedImageIds.delete(id);
      }
    } catch (error) {
      notify(`Sunum kaydedildi; kullanılmayan görseller temizlenemedi. ${error.message}`);
    }
  }

  function cacheImageAsset(asset) {
    const previous = imageAssets.get(asset.id);
    if (previous) URL.revokeObjectURL(previous.url);
    imageAssets.set(asset.id, { blob: asset.blob, url: URL.createObjectURL(asset.blob) });
    failedImageIds.delete(asset.id);
  }

  function clearImageCache() {
    for (const asset of imageAssets.values()) URL.revokeObjectURL(asset.url);
    imageAssets.clear();
    failedImageIds.clear();
    imageError = "";
  }

  function refreshImageHealth() {
    const missing = allAddedImages().filter(image => !imageAssets.has(image.id) || failedImageIds.has(image.id));
    imageError = !imageBusy && missing.length ? `${missing.length} görsel açılamadı. Görselli yedeğini yeniden yükle veya eksik görseli kaldır.` : "";
    updateSaveStatus();
  }

  function setImageBusy(message, pending = true) {
    imageBusy = message;
    imageOperationPending = Boolean(message) && pending;
    $("#editor-add-image").disabled = Boolean(message);
    $("#editor-image-file").disabled = Boolean(message);
    $("#editor-import").disabled = Boolean(message);
    $("#editor-export").disabled = Boolean(message);
    refreshImageHealth();
  }

  async function loadImageAssets() {
    const placed = allAddedImages();
    if (!placed.length) return;
    const targetDeck = deck;
    setImageBusy("Görseller yükleniyor…", false);
    try {
      const database = await openImageDatabase();
      const assets = await new Promise((resolve, reject) => {
        const transaction = database.transaction("images");
        const result = [];
        for (const image of placed) {
          const request = transaction.objectStore("images").get(image.id);
          request.onsuccess = () => { if (request.result) result.push(request.result); };
        }
        transaction.oncomplete = () => resolve(result);
        transaction.onabort = () => reject(transaction.error || new Error("Görseller okunamadı."));
      });
      if (deck !== targetDeck) return;
      for (const asset of assets) {
        if (!(asset.blob instanceof Blob) || !["image/png", "image/jpeg", "image/webp"].includes(asset.blob.type)) throw new Error("Yerel görsel dosyası geçersiz.");
        cacheImageAsset(asset);
      }
    } catch (error) {
      notify(`Görseller yüklenemedi. ${error.message}`);
    } finally {
      setImageBusy("");
      if (deck === targetDeck) {
        for (const id of Object.keys(deck.slides)) renderAddedImages(id);
        renderImageEditor();
        queueDraw();
        if (imageError) notify(imageError);
      }
    }
  }

  async function verifyImageBlob(file) {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    let type;
    if ([137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => header[index] === byte)) type = "image/png";
    else if (header[0] === 255 && header[1] === 216 && header[2] === 255) type = "image/jpeg";
    else if (String.fromCharCode(...header.slice(0, 4)) === "RIFF" && String.fromCharCode(...header.slice(8, 12)) === "WEBP") type = "image/webp";
    else throw new Error("PNG, JPG veya WebP dosyası seç.");
    const blob = file.slice(0, file.size, type);
    const bitmap = await createImageBitmap(blob);
    try {
      if (!bitmap.width || !bitmap.height) throw new Error("Görselin ölçüleri okunamadı.");
      return { blob, width: bitmap.width, height: bitmap.height };
    } finally { bitmap.close(); }
  }

  function blobDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.onabort = () => reject(new Error("Görsel okuma iptal edildi."));
      reader.readAsDataURL(blob);
    });
  }

  function dataUrlBlob(value) {
    if (typeof value !== "string" || !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) {
      throw new Error("Yedekte görsel dosyası eksik veya desteklenmeyen bir biçimde.");
    }
    const comma = value.indexOf(",");
    const bytes = Uint8Array.from(atob(value.slice(comma + 1)), char => char.charCodeAt(0));
    return new Blob([bytes]);
  }

  async function addImageFiles(files) {
    if (imageBusy) { notify("Önceki görsel işlemi sürüyor; tamamlanmasını bekle."); return; }
    const targetDeck = deck;
    const targetId = scenes[state.index].id;
    const prepared = [];
    const placed = [];
    setImageBusy("Görseller ekleniyor…");
    try {
      for (const file of files) {
        const verified = await verifyImageBlob(file);
        const id = `image-${crypto.randomUUID()}`;
        prepared.push({ id, blob: verified.blob });
        placed.push({ id, name: file.name, alt: file.name, x: 1, y: 1, width: .32, naturalWidth: verified.width, naturalHeight: verified.height });
      }
      await writeImageAssets(prepared);
      if (deck !== targetDeck || !deck.order.includes(targetId)) {
        removeStoredImages(prepared.map(asset => asset.id));
        throw new Error("İşlem sırasında slayt kaldırıldı veya sunum değişti. Görseli tekrar ekle.");
      }
      for (const asset of prepared) cacheImageAsset(asset);
      deck.slides[targetId].images.push(...placed);
      renderAddedImages(targetId);
      saveDeck();
      if (scenes[state.index].id === targetId && state.editing) {
        state.selectedImage = placed[placed.length - 1].id;
        renderImageEditor();
        setArrangement(true);
      } else notify("Görseller, seçtiğin slayda eklendi.");
    } catch (error) {
      notify(`Görsel eklenemedi. ${error.message}`);
    } finally {
      $("#editor-image-file").value = "";
      setImageBusy("");
    }
  }

  function selectedImage() {
    return currentSlide().images.find(image => image.id === state.selectedImage);
  }

  function imageGeometry(image, scene) {
    const bounds = scene.getBoundingClientRect();
    const ratio = image.naturalWidth / image.naturalHeight;
    const maximum = Math.min(bounds.width, bounds.height * ratio);
    const width = Math.min(maximum, Math.max(Math.min(32, maximum), image.width * bounds.width));
    const height = width / ratio;
    return { bounds, ratio, width, height, left: image.x * Math.max(0, bounds.width - width), top: image.y * Math.max(0, bounds.height - height) };
  }

  function positionImage(frame, image, scene) {
    const box = imageGeometry(image, scene);
    frame.style.left = `${box.left}px`;
    frame.style.top = `${box.top}px`;
    frame.style.width = `${box.width}px`;
    frame.style.height = `${box.height}px`;
  }

  function layoutAddedImages() {
    const scene = scenes[state.index];
    if (!scene || !scene.getClientRects().length) return;
    for (const image of currentSlide().images) {
      const frame = $(`[data-added-image="${image.id}"]`, scene);
      if (frame) positionImage(frame, image, scene);
    }
  }

  function renderAddedImages(id) {
    const scene = sceneElements.get(id);
    const placed = deck.slides[id].images;
    scene.classList.toggle("has-added-images", placed.length > 0);
    let layer = $(".added-image-layer", scene);
    if (!placed.length) {
      if (layer) layer.remove();
      imageLayoutObserver.unobserve(scene);
      return;
    }
    imageLayoutObserver.observe(scene);
    if (!layer) {
      layer = createElement("div", "added-image-layer");
      scene.append(layer);
    }
    const present = new Set(placed.map(image => image.id));
    for (const frame of Array.from(layer.children)) if (!present.has(frame.dataset.addedImage)) frame.remove();
    placed.forEach((image, index) => {
      let frame = $(`[data-added-image="${image.id}"]`, layer);
      if (!frame) {
        frame = createElement("div", "added-image");
        frame.dataset.addedImage = image.id;
        const target = createElement("button", "added-image-target");
        target.type = "button";
        const photo = createElement("img");
        photo.draggable = false;
        photo.addEventListener("error", () => {
          const asset = imageAssets.get(image.id);
          if (!frame.isConnected || !asset || photo.src !== asset.url) return;
          failedImageIds.add(image.id);
          photo.hidden = true;
          $(".added-image-error", frame).hidden = false;
          refreshImageHealth();
        });
        const placeholder = createElement("span", "added-image-error");
        target.append(photo, placeholder);
        const resize = createElement("button", "image-resize-handle");
        resize.type = "button";
        resize.setAttribute("aria-label", "Görseli boyutlandır; oklarla veya + / − ile değiştir");
        frame.append(target, resize);
        layer.append(frame);
      }
      frame.style.zIndex = String(index + 1);
      const photo = $("img", frame);
      const asset = imageAssets.get(image.id);
      photo.alt = image.alt;
      photo.hidden = !asset || failedImageIds.has(image.id);
      if (asset && photo.src !== asset.url) photo.src = asset.url;
      const placeholder = $(".added-image-error", frame);
      placeholder.hidden = !photo.hidden;
      placeholder.textContent = imageBusy ? "Görsel yükleniyor…" : `Görsel bulunamadı: ${image.name}`;
    });
    refreshImageSelection(layer);
    queueDraw();
  }

  function refreshImageSelection(root = document) {
    for (const frame of $$("[data-added-image]", root)) {
      const image = deck.slides[frame.closest(".scene").id].images.find(item => item.id === frame.dataset.addedImage);
      const target = $(".added-image-target", frame);
      const selected = state.editing && image.id === state.selectedImage;
      frame.classList.toggle("is-selected", selected);
      target.setAttribute("aria-label", `${state.editing ? "Görseli seç ve yerleştir" : "Görseli büyüt"}: ${image.alt || image.name}`);
      if (state.editing) {
        target.setAttribute("aria-pressed", String(selected));
        target.removeAttribute("aria-haspopup");
      } else {
        target.removeAttribute("aria-pressed");
        target.setAttribute("aria-haspopup", "dialog");
      }
    }
  }

  function renderImageEditor() {
    if (!state.editing) return;
    const placed = currentSlide().images;
    $("#editor-arrange-images").disabled = placed.length === 0;
    $("#editor-images-group").hidden = placed.length === 0;
    const list = $("#editor-image-list");
    list.replaceChildren();
    for (const image of placed) {
      const button = createElement("button", "editor-image-choice");
      button.type = "button";
      button.dataset.selectImage = image.id;
      button.setAttribute("aria-pressed", String(image.id === state.selectedImage));
      const asset = imageAssets.get(image.id);
      if (asset && !failedImageIds.has(image.id)) {
        const thumbnail = createElement("img");
        thumbnail.src = asset.url;
        thumbnail.alt = "";
        button.append(thumbnail);
      }
      button.append(createElement("span", "", image.name));
      button.addEventListener("click", () => {
        selectAddedImage(image.id);
        $(`[data-select-image="${image.id}"]`).focus({ preventScroll: true });
      });
      list.append(button);
    }
    const image = selectedImage();
    $("#editor-image-controls").hidden = !image;
    if (image) {
      $("#editor-images-group").open = true;
      $("#editor-image-alt").value = image.alt;
      updateImageSizeControl(image);
    }
  }

  function updateImageSizeControl(image) {
    $("#editor-image-size").value = String(Math.round(image.width * 100));
    $("#editor-image-size-value").textContent = `%${Math.round(image.width * 100)}`;
  }

  function selectAddedImage(id, focus = false) {
    state.selectedImage = id;
    refreshImageSelection();
    renderImageEditor();
    if (focus) $(`[data-added-image="${id}"] .added-image-target`, scenes[state.index]).focus({ preventScroll: true });
  }

  function setArrangement(enabled, focus = true) {
    finishImageGesture(false);
    state.arranging = enabled && state.editing;
    presentation.dataset.imageArrange = String(state.arranging);
    editorPanel.hidden = !state.editing || state.arranging;
    $("#image-layout-done").hidden = !state.arranging;
    if (state.arranging && currentSlide().images.length) {
      selectAddedImage(selectedImage() ? state.selectedImage : currentSlide().images[0].id, focus);
      notify(storageError || imageError || "Görseli sürükle; sağ alt köşeden boyutlandır. Panele dön ile yazıları düzenleyebilirsin.");
    } else {
      clearTimeout(feedbackTimer);
      $("#feedback").hidden = true;
      if (state.editing && focus) {
        renderImageEditor();
        $("#editor-arrange-images").focus({ preventScroll: true });
      }
    }
    queueDraw();
  }

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

  function resizePlacedImage(image, width, scene, left, top) {
    const bounds = scene.getBoundingClientRect();
    const maximum = Math.min(bounds.width, bounds.height * image.naturalWidth / image.naturalHeight);
    image.width = clamp(width / bounds.width, .03, Math.max(.03, maximum / bounds.width));
    const next = imageGeometry(image, scene);
    image.x = next.bounds.width > next.width ? clamp(left / (next.bounds.width - next.width), 0, 1) : 0;
    image.y = next.bounds.height > next.height ? clamp(top / (next.bounds.height - next.height), 0, 1) : 0;
  }

  function startImageGesture(event) {
    const frame = event.target.closest("[data-added-image]");
    if (!frame || !state.editing || event.button !== 0 || !event.isPrimary || imageGesture) return;
    const image = currentSlide().images.find(item => item.id === frame.dataset.addedImage);
    selectAddedImage(image.id);
    if (!state.arranging) return;
    event.preventDefault();
    const resize = Boolean(event.target.closest(".image-resize-handle"));
    (resize ? $(".image-resize-handle", frame) : $(".added-image-target", frame)).focus({ preventScroll: true });
    const scene = scenes[state.index];
    imageGesture = {
      frame, image, scene, pointerId: event.pointerId, resize, clientX: event.clientX, clientY: event.clientY,
      box: imageGeometry(image, scene), original: { x: image.x, y: image.y, width: image.width }, changed: false
    };
    frame.setPointerCapture(event.pointerId);
    stage.classList.add("is-image-dragging");
  }

  function moveImageGesture(event) {
    const gesture = imageGesture;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    event.preventDefault();
    const bounds = gesture.scene.getBoundingClientRect();
    if (bounds.width !== gesture.box.bounds.width || bounds.height !== gesture.box.bounds.height) {
      finishImageGesture(true);
      return;
    }
    const dx = event.clientX - gesture.clientX + gesture.box.bounds.left - bounds.left;
    const dy = event.clientY - gesture.clientY + gesture.box.bounds.top - bounds.top;
    if (Math.hypot(dx, dy) < 2 && !gesture.changed) return;
    gesture.changed = true;
    if (gesture.resize) {
      // Project the pointer movement onto the image's aspect-ratio line.
      const slope = 1 / gesture.box.ratio;
      const width = gesture.box.width + (dx + dy * slope) / (1 + slope * slope);
      resizePlacedImage(gesture.image, width, gesture.scene, gesture.box.left, gesture.box.top);
    } else {
      const horizontal = bounds.width - gesture.box.width;
      const vertical = bounds.height - gesture.box.height;
      gesture.image.x = horizontal > 0 ? clamp((gesture.box.left + dx) / horizontal, 0, 1) : 0;
      gesture.image.y = vertical > 0 ? clamp((gesture.box.top + dy) / vertical, 0, 1) : 0;
    }
    positionImage(gesture.frame, gesture.image, gesture.scene);
    updateImageSizeControl(gesture.image);
  }

  function finishImageGesture(cancel) {
    const gesture = imageGesture;
    if (!gesture) return;
    imageGesture = null;
    if (cancel) Object.assign(gesture.image, gesture.original);
    if (gesture.frame.hasPointerCapture(gesture.pointerId)) gesture.frame.releasePointerCapture(gesture.pointerId);
    stage.classList.remove("is-image-dragging");
    positionImage(gesture.frame, gesture.image, gesture.scene);
    updateImageSizeControl(gesture.image);
    if (gesture.changed && !cancel) saveDeck();
  }

  function handleImageKey(event) {
    const frame = event.target.closest("[data-added-image]");
    if (!frame || !state.editing || event.ctrlKey || event.metaKey || event.altKey) return false;
    if (event.key === "Escape") return false;
    const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const sizing = ["+", "=", "-", "_"].includes(event.key);
    if (!arrows[event.key] && !sizing) return false;
    event.preventDefault();
    if (imageGesture) return true;
    if (!state.arranging) setArrangement(true, false);
    const image = currentSlide().images.find(item => item.id === frame.dataset.addedImage);
    const scene = scenes[state.index];
    const box = imageGeometry(image, scene);
    const distance = event.shiftKey ? 20 : 4;
    if (sizing || event.target.closest(".image-resize-handle")) {
      const direction = ["-", "_", "ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1;
      resizePlacedImage(image, box.width + direction * distance, scene, box.left, box.top);
    } else {
      const [x, y] = arrows[event.key];
      image.x = box.bounds.width > box.width ? clamp((box.left + x * distance) / (box.bounds.width - box.width), 0, 1) : 0;
      image.y = box.bounds.height > box.height ? clamp((box.top + y * distance) / (box.bounds.height - box.height), 0, 1) : 0;
    }
    positionImage(frame, image, scene);
    updateImageSizeControl(image);
    saveDeck();
    return true;
  }

  async function exportDeck() {
    try {
      const snapshot = structuredClone(deck);
      const placed = allAddedImages(snapshot);
      if (placed.some(image => !imageAssets.has(image.id) || failedImageIds.has(image.id))) {
        throw new Error("Eksik görsel var. Önce görselli yedeği geri yükle veya eksik görseli kaldır.");
      }
      if (placed.length) {
        const files = placed.map(image => ({ id: image.id, blob: imageAssets.get(image.id).blob }));
        snapshot.assets = {};
        for (const file of files) snapshot.assets[file.id] = await blobDataUrl(file.blob);
      }
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = createElement("a");
      link.href = url;
      link.download = `vault-sunumu-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      notify(`Yedek indirilemedi. ${error.message}`);
    }
  }

  async function importDeck(file) {
    setImageBusy("Yedek okunuyor…");
    let imported;
    const prepared = [];
    let stored = false;
    try {
      const source = JSON.parse(await file.text());
      imported = validateDeck(source);
      for (const image of allAddedImages(imported)) {
        const data = source.assets && Object.hasOwn(source.assets, image.id) ? source.assets[image.id] : null;
        const verified = await verifyImageBlob(dataUrlBlob(data));
        if (verified.width !== image.naturalWidth || verified.height !== image.naturalHeight) throw new Error("Görsel dosyası ile kayıtlı ölçüleri uyuşmuyor.");
        image.id = `image-${crypto.randomUUID()}`;
        prepared.push({ id: image.id, blob: verified.blob });
      }
      if (!confirm("Bu yedek, tarayıcıdaki mevcut sunumun yerini alacak. Devam edilsin mi?")) return;
      const previous = JSON.stringify(deck);
      const revision = storageRevision;
      if (prepared.length) { await writeImageAssets(prepared); stored = true; }
      if (JSON.stringify(deck) !== previous || storageRevision !== revision) throw new Error("Yükleme sırasında sunum değişti. Yedeği tekrar yükle.");
    } catch (error) {
      if (stored) removeStoredImages(prepared.map(asset => asset.id));
      notify(`Yedek yüklenemedi; mevcut sunum korundu. ${error.message}`);
      return;
    } finally {
      setImageBusy("");
      $("#editor-import-file").value = "";
    }
    finishImageGesture(true);
    const current = scenes[state.index].id;
    clearImageCache();
    for (const asset of prepared) cacheImageAsset(asset);
    deck = imported;
    storageConflict = false;
    refreshDeck(current);
    refreshImageHealth();
    if (!unsaved) notify("Yedek yüklendi ve bu tarayıcıya kaydedildi.");
  }

  $("#previous-scene").addEventListener("click", () => showScene(state.index - 1));
  $("#next-scene").addEventListener("click", () => showScene(state.index + 1));
  $("#chapters-toggle").addEventListener("click", () => chapterDialog.showModal());
  $("#chapters-close").addEventListener("click", () => chapterDialog.close());
  $("#detail-close").addEventListener("click", () => closeDetails());
  $("#image-close").addEventListener("click", () => imageDialog.close());
  $$("[data-detail]").forEach(button => {
    button.setAttribute("aria-controls", "detail-panel");
    button.setAttribute("aria-expanded", "false");
  });
  stage.addEventListener("click", event => {
    const frame = event.target.closest("[data-added-image]");
    if (frame) {
      const image = currentSlide().images.find(item => item.id === frame.dataset.addedImage);
      if (state.editing) {
        selectAddedImage(image.id);
        if (!state.arranging) setArrangement(true);
      } else {
        const asset = imageAssets.get(image.id);
        if (!asset || failedImageIds.has(image.id)) { notify("Görsel bulunamadı. Görselli yedeğini yeniden yükle."); return; }
        showImage({ src: asset.url, title: image.name, alt: image.alt }, "Görsel açılamadı. Görselli yedeğini yeniden yükle.");
      }
      return;
    }
    const detail = event.target.closest("[data-detail]");
    if (detail) {
      openDetails(detail.dataset.detail, detail);
      return;
    }
    if (!state.editing) return;
    const target = event.target.closest("[data-editor-target]");
    if (!target) return;
    if (state.arranging) setArrangement(false, false);
    if (target.dataset.editorTarget === "extra") {
      $("#editor-extra-group").open = true;
      const input = extraInputs.get(target.dataset.editorField);
      input.focus();
      input.select();
    } else {
      const input = $(`#editor-${target.dataset.editorTarget}`);
      input.focus();
      const item = event.target.closest(".slide-points > li");
      if (item) {
        const index = Array.from(target.children).indexOf(item);
        const start = currentSlide().points.slice(0, index).reduce((total, point) => total + point.length + 1, 0);
        input.setSelectionRange(start, start + currentSlide().points[index].length);
      } else input.select();
    }
  });
  stage.addEventListener("pointerdown", startImageGesture);
  stage.addEventListener("pointermove", moveImageGesture);
  stage.addEventListener("pointerup", event => { if (imageGesture && event.pointerId === imageGesture.pointerId) finishImageGesture(false); });
  stage.addEventListener("pointercancel", event => { if (imageGesture && event.pointerId === imageGesture.pointerId) finishImageGesture(true); });
  stage.addEventListener("lostpointercapture", event => { if (imageGesture && event.pointerId === imageGesture.pointerId) finishImageGesture(false); });
  stage.addEventListener("dragover", event => {
    if (!Array.from(event.dataTransfer.types).includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = state.editing ? "copy" : "none";
  });
  stage.addEventListener("drop", event => {
    if (!event.dataTransfer.files.length) return;
    event.preventDefault();
    if (!state.editing) { notify("Görsel eklemek için önce Düzenle düğmesine bas."); return; }
    addImageFiles(Array.from(event.dataTransfer.files));
  });
  $$("[data-benefit]").forEach(button => button.addEventListener("click", () => updateBenefit(button.dataset.benefit)));
  $$("[data-trace-step]").forEach(button => button.addEventListener("click", () => updateTrace(Number(button.dataset.traceStep))));
  $$("[data-learning]").forEach(button => button.addEventListener("click", () => updateLearning(button.dataset.learning)));
  $$("[data-image]").forEach(button => {
    button.setAttribute("aria-haspopup", "dialog");
    button.addEventListener("click", () => openImage(button.dataset.image));
  });
  $(".skip-link").addEventListener("click", event => {
    event.preventDefault();
    (state.editing ? $("#editor-title") : stage).focus({ preventScroll: true });
  });
  $("#edit-toggle").addEventListener("click", () => setEditing(!state.editing));
  $("#editor-close").addEventListener("click", () => setEditing(false));
  $("#editor-title").addEventListener("input", event => changeCurrentSlide(slide => { slide.title = event.target.value; }));
  $("#editor-section").addEventListener("input", event => changeCurrentSlide(slide => { slide.section = event.target.value; }));
  $("#editor-points").addEventListener("input", event => changeCurrentSlide(slide => { slide.points = splitLines(event.target.value); }));
  $("#editor-add-line").addEventListener("click", () => {
    changeCurrentSlide(slide => { slide.points.push(""); });
    const input = $("#editor-points");
    input.value = currentSlide().points.join("\n");
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    input.scrollTop = input.scrollHeight;
  });
  $("#editor-add-slide").addEventListener("click", addSlide);
  $("#editor-move-back").addEventListener("click", () => moveSlide(-1));
  $("#editor-move-forward").addEventListener("click", () => moveSlide(1));
  $("#editor-delete-slide").addEventListener("click", deleteSlide);
  $("#editor-add-image").addEventListener("click", () => $("#editor-image-file").click());
  $("#editor-image-file").addEventListener("change", event => {
    const files = Array.from(event.target.files);
    if (files.length) addImageFiles(files);
  });
  $("#editor-arrange-images").addEventListener("click", () => setArrangement(true));
  $("#image-layout-done").addEventListener("click", () => setArrangement(false));
  $("#editor-image-alt").addEventListener("input", event => {
    const image = selectedImage();
    if (!image) return;
    image.alt = event.target.value;
    renderAddedImages(scenes[state.index].id);
    saveDeck();
  });
  $("#editor-image-size").addEventListener("input", event => {
    const image = selectedImage();
    if (!image) return;
    image.width = Number(event.target.value) / 100;
    layoutAddedImages();
    updateImageSizeControl(image);
    saveDeck();
  });
  $("#editor-image-front").addEventListener("click", () => {
    const image = selectedImage();
    if (!image) return;
    const placed = currentSlide().images;
    placed.splice(placed.indexOf(image), 1);
    placed.push(image);
    renderAddedImages(scenes[state.index].id);
    renderImageEditor();
    saveDeck();
  });
  $("#editor-image-remove").addEventListener("click", () => {
    const image = selectedImage();
    if (!image || !confirm(`“${image.name}” görseli slayttan kaldırılsın mı?`)) return;
    currentSlide().images.splice(currentSlide().images.indexOf(image), 1);
    state.selectedImage = null;
    renderAddedImages(scenes[state.index].id);
    renderImageEditor();
    refreshImageHealth();
    saveDeck();
    $("#editor-add-image").focus({ preventScroll: true });
  });
  $("#editor-export").addEventListener("click", exportDeck);
  $("#editor-import").addEventListener("click", () => $("#editor-import-file").click());
  $("#editor-import-file").addEventListener("change", event => {
    const file = event.target.files[0];
    if (file) importDeck(file);
  });
  $("#editor-reset").addEventListener("click", () => {
    if (!confirm("Tüm düzenlemeler ve eklenen slaytlar kaldırılıp ilk sunum açılsın mı? Önce yedek indirebilirsin.")) return;
    finishImageGesture(true);
    clearImageCache();
    deck = structuredClone(defaultDeck);
    storageConflict = false;
    refreshDeck(deck.order[0]);
  });
  document.addEventListener("keydown", event => {
    if (imageDialog.open || chapterDialog.open) return;
    if (handleImageKey(event)) return;
    if (event.key === "Escape" && imageGesture) {
      finishImageGesture(true);
      event.preventDefault();
      return;
    }
    if (event.key === "Escape" && state.arranging) {
      setArrangement(false);
      event.preventDefault();
      return;
    }
    if (state.editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      finishImageGesture(false);
      if (saveDeck()) notify("Bu tarayıcıya kaydedildi. Dosya yedeği için Yedek indir düğmesini kullan.");
      return;
    }
    if (event.key === "Escape" && state.editing) {
      setEditing(false);
      event.preventDefault();
      return;
    }
    if (event.key === "Escape" && !detailPanel.hidden) {
      closeDetails();
      event.preventDefault();
      return;
    }
    if (!detailPanel.hidden || event.altKey || event.ctrlKey || event.metaKey || event.target.closest("input, textarea, select, [contenteditable='true']")) return;
    const navigation = { ArrowRight: state.index + 1, ArrowLeft: state.index - 1, PageDown: state.index + 1, PageUp: state.index - 1, Home: 0, End: scenes.length - 1 };
    if (Object.prototype.hasOwnProperty.call(navigation, event.key)) {
      event.preventDefault();
      showScene(navigation[event.key], { focus: true });
    }
  });

  const fullscreenButton = $("#fullscreen-toggle");
  fullscreenButton.disabled = !document.fullscreenEnabled;
  fullscreenButton.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (error) {
      notify(`Tam ekran açılamadı: ${error.message}`);
    }
  });
  document.addEventListener("fullscreenchange", () => {
    fullscreenButton.setAttribute("aria-label", document.fullscreenElement ? "Tam ekrandan çık" : "Tam ekranı aç");
    queueDraw();
    fitImage();
  });

  function showHashScene(updateHash) {
    const target = location.hash.slice(1);
    const index = target ? scenes.findIndex(scene => scene.id === target) : 0;
    showScene(index < 0 ? 0 : index, { updateHash });
    if (index < 0) notify("Bu bölüm bulunamadı; ilk bölüm açıldı.");
  }

  window.addEventListener("hashchange", () => showHashScene(false));
  window.addEventListener("beforeunload", event => {
    if (!unsaved && !imageOperationPending && !(imageGesture && imageGesture.changed)) return;
    event.preventDefault();
    event.returnValue = "";
  });
  window.addEventListener("storage", event => {
    if ((event.key !== storageKey && event.key !== null) || event.newValue === JSON.stringify(deck)) return;
    storageRevision++;
    storageConflict = true;
    storageError = "Sunum başka bir sekmede değişti. Bu sekmenin yedeğini indirip sayfayı yenile.";
    updateSaveStatus();
    notify(storageError);
  });
  const graphObserver = new ResizeObserver(queueDraw);
  $$("[data-graph]").forEach(graph => {
    graphObserver.observe(graph);
    $$("[data-node]", graph).forEach(node => graphObserver.observe(node));
  });
  new ResizeObserver(fitImage).observe($("#image-canvas"));
  const imageLayoutObserver = new ResizeObserver(queueDraw);
  imageLayoutObserver.observe(stage);
  const defaultDeck = createDefaultDeck();
  deck = loadDeck(defaultDeck);
  persistedImageIds = new Set(allAddedImages().map(image => image.id));
  loadImageAssets();
  renderDeck();
  updateBenefit("analysis");
  updateTrace(0);
  updateLearning("first");
  showHashScene(true);
  updateSaveStatus();
  if (storageError) notify(storageError);
})();
