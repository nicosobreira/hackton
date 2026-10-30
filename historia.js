// Leitor de frames da história da Margaret Hamilton.
// O texto vem de HISTORIA.md (via historia-dados.js). Aqui ficam só a navegação,
// os visuais de cada frame e as duas mecânicas: tutorial de prioridade e o jogo.
(() => {
  const $ = (seletor) => document.querySelector(seletor);
  const SECOES = window.HISTORIA_SECOES || [];

  // Rótulo pequeno ao lado do nome da seção, no topo (como "UMA MISSÃO IMPOSSÍVEL" no Figma).
  const SUBTITULOS = {
    "introducao": "Apollo 8 · 1968",
    "contexto": "O trabalho da equipe",
    "funcionamento-do-executive": "Como o computador decide",
    "conclusao": "Apollo 11 · 1969",
    "protagonismo-feminino": "Engenharia de software",
    "encerramento": "Agora é a sua vez",
  };

  // Ilustrações. Para usar uma foto de verdade, troque o `src` (ex.: "assets/fotos/margaret-equipe.jpg").
  const IMAGENS = {
    margaret: { src: "assets/margaret-hamilton.svg", alt: "Ilustração de Margaret Hamilton junto a listagens de código da Apollo", legenda: "Margaret Hamilton" },
    equipe: { src: "assets/margaret-hamilton.svg", alt: "Ilustração de Margaret Hamilton e sua equipe", legenda: "Margaret e sua equipe" },
    pilha: { src: "assets/codigo-apollo.svg", alt: "Ilustração das listagens de código da Apollo empilhadas", legenda: "O código da Apollo" },
    codigo: { src: "assets/codigo-apollo.svg", alt: "Ilustração de listagens e documentos de programação da Apollo", legenda: "Programas da Apollo" },
    saturn: { src: "assets/saturn-v.svg", alt: "Ilustração do foguete Saturn V", legenda: "O foguete Saturn V" },
    controle: { src: "assets/sala-de-controle.svg", alt: "Ilustração da sala de controle da missão", legenda: "Controle da missão, em Houston" },
    descida: { src: "assets/eagle-descida.svg", alt: "Ilustração do módulo lunar Eagle durante a descida", legenda: "O Eagle se aproxima da Lua" },
    pouso: { src: "assets/eagle-na-lua.svg", alt: "Ilustração do módulo lunar Eagle na superfície da Lua", legenda: "O Eagle na superfície lunar" },
  };
  const img = (k) => ({ t: "img", k });
  const lua = { t: "lua" }, terra = { t: "terra" };
  const bancos = (n) => ({ t: "bancos", ocupados: n });

  // Visual de cada faixa de frames: [do frame, até o frame, visual]. Frames sem faixa usam a Lua.
  const VISUAIS = {
    "introducao": [[1, 1, terra], [3, 3, { t: "alarme", titulo: "ERRO", sub: "alerta do sistema" }], [4, 4, { t: "alarme", titulo: "ERRO", sub: "dados apagados" }], [5, 9, img("margaret")], [10, 11, img("codigo")], [12, 12, { t: "alarme", titulo: "ERRO", sub: "sequência ativada" }], [14, 14, img("margaret")]],
    "contexto": [[1, 1, img("equipe")], [2, 5, img("codigo")]],
    "funcionamento-do-executive": [[3, 5, img("saturn")], [8, 8, img("descida")], [9, 9, terra], [10, 21, img("codigo")], [22, 28, bancos(0)]],
    "conclusao": [[1, 3, img("descida")], [4, 5, img("codigo")], [6, 6, bancos(3)], [7, 7, bancos(6)], [8, 8, bancos(4)], [12, 17, img("controle")], [18, 18, img("pouso")], [19, 21, img("codigo")]],
    "protagonismo-feminino": [[1, 1, img("pilha")], [2, 6, img("codigo")], [7, 7, img("margaret")]],
    "encerramento": [[1, 5, img("margaret")]],
  };
  const visualDe = (secao, num) => (VISUAIS[secao] || []).find(([de, ate]) => num >= de && num <= ate)?.[2] ?? lua;

  // Tutorial de prioridade (frame marcado com "Primeiro tutorial do jogo").
  const OPCOES = [
    { emoji: "📡", nome: "Rastrear o radar de encontro", msg: "Esse radar só será útil mais tarde, quando a nave precisar se encontrar com outra. No lançamento, ele pode esperar." },
    { emoji: "🚀", nome: "Guiar a subida da Saturn V", certa: true, msg: "Isso! Sem esse programa a nave nem sai do chão. Para o lançamento, ele é o essencial." },
    { emoji: "🌙", nome: "Guiar a descida lunar", msg: "Fundamental, mas só na hora do pouso. Para o lançamento, ele pode esperar." },
  ];

  const TEXTO_RESULTADO = {
    success: "Missão cumprida! Você manteve o essencial funcionando e a nave pousou na Lua.",
    failure: "A missão falhou — e tudo bem. Perder faz parte do jogo. Vamos continuar a história.",
    nenhum: "A missão terminou. Vamos continuar a história.",
  };

  // Lista única de passos: os frames do HISTORIA.md, mais o frame do resultado do jogo.
  const passos = [];
  SECOES.forEach((secao, indice) => {
    if (secao.id === "conclusao") passos.push({ tipo: "resultado", indice, visual: lua });
    secao.frames.forEach((frame) => {
      const notas = frame.notas.join(" ");
      const tipo = /tutorial/i.test(notas) ? "prioridade" : /come[çc]ar o jogo/i.test(notas) ? "jogo" : "frame";
      passos.push({ tipo, indice, texto: frame.texto, visual: visualDe(secao.id, frame.num) });
    });
  });

  let atual = 0, resultado = null, prioridadeOk = false, jogando = false, chaveVisual = "";
  const el = {
    palco: $("#palco"), texto: $("#frame-texto"), extra: $("#frame-extra"), continuar: $("#continuar"),
    rotuloContinuar: $("#continuar-rotulo"), voltar: $("#voltar"), visual: $("#visual"),
    camada: $("#camada-jogo"), moldura: $("#moldura-jogo"),
    barra: $("#progresso-barra"), num: $("#progresso-num"), progresso: $("#progresso"),
  };

  // Markdown mínimo do HISTORIA.md: ***negrito itálico***, **negrito**, *itálico*.
  function inline(texto) {
    return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");
  }

  function criar(tag, classe, texto) {
    const no = document.createElement(tag);
    if (classe) no.className = classe;
    if (texto !== undefined) no.textContent = texto;
    return no;
  }

  function montarVisual(v) {
    if (v.t === "lua") { const no = criar("div", "lua"); no.append(criar("i"), criar("i"), criar("i")); no.setAttribute("role", "img"); no.setAttribute("aria-label", "A Lua"); return no; }
    if (v.t === "terra") { const no = criar("div", "terra"); no.append(criar("i"), criar("i"), criar("i")); no.setAttribute("role", "img"); no.setAttribute("aria-label", "A Terra"); return no; }
    if (v.t === "alarme") { const no = criar("div", "alarme"); no.append(criar("b", "", v.titulo), criar("span", "", v.sub)); no.setAttribute("role", "img"); no.setAttribute("aria-label", `Alarme: ${v.sub}`); return no; }
    if (v.t === "bancos") {
      const no = criar("div", "bancos"), grade = criar("div", "bancos-grade");
      for (let n = 0; n < 6; n++) grade.append(criar("div", n < v.ocupados ? "banco ocupado" : "banco", n < v.ocupados ? "1202" : "livre"));
      no.append(grade, criar("div", "lixeira", "🗑 Lixeira"));
      no.setAttribute("role", "img");
      no.setAttribute("aria-label", `Blocos de memória: ${6 - v.ocupados} livres e ${v.ocupados} ocupados pelo erro 1202`);
      return no;
    }
    const d = IMAGENS[v.k], fig = criar("figure", "vis-img"), imagem = criar("img");
    imagem.src = d.src; imagem.alt = d.alt;
    fig.append(imagem, criar("figcaption", "", d.legenda));
    return fig;
  }

  function trocarVisual(v) {
    const chave = JSON.stringify(v);
    if (chave === chaveVisual) return;
    chaveVisual = chave;
    el.visual.replaceChildren(montarVisual(v));
    el.visual.style.animation = "none"; void el.visual.offsetWidth; el.visual.style.animation = "";
  }

  function montarPrioridade() {
    const retorno = criar("p", "retorno"); retorno.setAttribute("role", "status");
    const botoes = OPCOES.map((o) => {
      const b = criar("button", "opcao"); b.type = "button";
      b.append(criar("span", "emoji", o.emoji), criar("span", "", o.nome));
      b.addEventListener("click", () => {
        if (prioridadeOk) return;
        retorno.textContent = o.msg;
        b.classList.remove("certa", "errada");
        b.classList.add(o.certa ? "certa" : "errada");
        b.querySelector(".selo")?.remove();
        b.append(criar("span", "selo", o.certa ? "✓ essencial" : "✕ pode esperar"));
        if (o.certa) { prioridadeOk = true; botoes.forEach((x) => (x.disabled = true)); el.continuar.disabled = false; }
      });
      return b;
    });
    el.extra.replaceChildren(...botoes, retorno);
  }

  function montarJogo() {
    const b = criar("button", "botao-jogo", "▶ Começar o jogo"); b.type = "button";
    b.addEventListener("click", iniciarJogo);
    el.extra.replaceChildren(b);
  }

  function render() {
    const p = passos[atual], secao = SECOES[p.indice], ultimo = atual === passos.length - 1;
    $("#topo-num").textContent = String(p.indice + 1).padStart(2, "0");
    $("#topo-secao").textContent = secao.titulo;
    $("#topo-sub").textContent = SUBTITULOS[secao.id] || "";

    const texto = p.tipo === "resultado" ? TEXTO_RESULTADO[resultado || "nenhum"] : p.texto;
    el.texto.innerHTML = inline(texto);
    const tamanho = texto.length < 60 ? "t-xl" : texto.length < 125 ? "t-lg" : "t-md";
    el.texto.className = `frame-texto ${tamanho}`;
    void el.texto.offsetWidth; // reinicia a animação de entrada

    el.extra.replaceChildren();
    const jogoPendente = p.tipo === "jogo" && !resultado;
    if (p.tipo === "prioridade" && !prioridadeOk) montarPrioridade();
    if (jogoPendente) montarJogo();
    if (ultimo) { const a = criar("a", "botao-jogo", "Voltar à galeria"); a.href = "index.html#proximas-historias"; el.extra.append(a); }

    el.continuar.hidden = jogoPendente;
    el.continuar.disabled = p.tipo === "prioridade" && !prioridadeOk;
    el.rotuloContinuar.textContent = ultimo ? "Rever do início" : "Continuar";
    el.voltar.disabled = atual === 0;
    trocarVisual(p.visual);

    el.num.textContent = `${String(atual + 1).padStart(3, "0")} / ${String(passos.length).padStart(3, "0")}`;
    el.barra.style.width = `${((atual + 1) / passos.length) * 100}%`;
    el.progresso.setAttribute("aria-valuemax", String(passos.length));
    el.progresso.setAttribute("aria-valuenow", String(atual + 1));
  }

  function travado() {
    const p = passos[atual];
    return (p.tipo === "prioridade" && !prioridadeOk) || (p.tipo === "jogo" && !resultado);
  }
  function avancar() {
    if (jogando || travado()) return;
    if (atual === passos.length - 1) { atual = 0; resultado = null; prioridadeOk = false; } // rever do início
    else atual++;
    render();
  }
  function recuar() {
    if (jogando || atual === 0) return;
    atual--; render();
  }

  // Jogo: carregado só quando a pessoa clica, para a partida começar do zero.
  function iniciarJogo() {
    const quadro = criar("iframe");
    quadro.src = "jogo/index.html?scene=game&story=1";
    quadro.title = "Hamilton: o software da Apollo — jogo interativo";
    quadro.allow = "fullscreen";
    el.moldura.replaceChildren(quadro);
    el.camada.hidden = false;
    jogando = true;
  }
  window.addEventListener("message", (evento) => {
    const quadro = el.moldura.querySelector("iframe");
    const dados = evento.data;
    if (!quadro || evento.source !== quadro.contentWindow || !dados || dados.type !== "hamilton:result") return;
    resultado = dados.result === "success" ? "success" : "failure";
    el.moldura.replaceChildren();
    el.camada.hidden = true;
    jogando = false;
    atual++; // próximo passo: o frame do resultado
    render();
  });

  // Clique na tela, Enter, Espaço ou seta para a direita avançam; seta para a esquerda volta.
  document.addEventListener("click", (e) => {
    if (e.target.closest("button, a, .frame-extra, iframe")) return;
    avancar();
  });
  document.addEventListener("keydown", (e) => {
    if (jogando || e.altKey || e.ctrlKey || e.metaKey) return;
    const emControle = e.target.closest && e.target.closest("button, a, input, select, textarea");
    if (e.key === "ArrowRight") { e.preventDefault(); avancar(); }
    else if (e.key === "ArrowLeft" || e.key === "Backspace") { e.preventDefault(); recuar(); }
    else if ((e.key === "Enter" || e.key === " ") && !emControle) { e.preventDefault(); avancar(); }
  });
  el.continuar.addEventListener("click", avancar);
  el.voltar.addEventListener("click", recuar);

  // Estrelas: posições pseudoaleatórias fixas (mesmo céu a cada visita).
  (() => {
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const caixa = $("#estrelas");
    for (let n = 0; n < 80; n++) {
      const e = criar("i"), t = rnd() < .15 ? 2 : 1;
      e.style.cssText = `left:${rnd() * 100}%;top:${rnd() * 100}%;width:${t}px;height:${t}px;animation-delay:${-rnd() * 5}s;opacity:${.25 + rnd() * .5}`;
      caixa.append(e);
    }
  })();

  if (passos.length) render();
})();
