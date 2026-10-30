(() => {
  const $ = (selector) => document.querySelector(selector);
  const fila = $("#g-queue");
  const botaoInicio = $("#g-start");
  const mensagem = $("#g-msg");
  const barra = $("#g-load");
  const rotuloCarga = $("#g-load-label");
  const DURACAO = 40;
  const TAREFAS = [
    { nome: "Pouso", prioridade: 3 },
    { nome: "Motores", prioridade: 3 },
    { nome: "Radar", prioridade: 2 },
    { nome: "Navegação", prioridade: 2 },
    { nome: "Rádio", prioridade: 1 },
    { nome: "Painel", prioridade: 1 }
  ];
  const prioridadeTexto = ["", "Baixa", "Média", "Alta"];
  const pontosPorTarefa = [0, 2, 5, 10];
  let estado = null;
  let intervalo = null;
  let idTarefa = 0;

  function atualizarBarras() {
    if (!estado) return;
    estado.tarefas.forEach((tarefa) => {
      const elemento = fila.querySelector(`[data-id="${tarefa.id}"] i`);
      if (elemento) elemento.style.width = `${Math.max(0, tarefa.tempo / tarefa.duracao * 100)}%`;
    });
    $("#g-score").textContent = estado.pontos;
    $("#g-time").textContent = Math.ceil(Math.max(0, estado.tempo));
    $("#g-lives").textContent = "♥ ".repeat(Math.max(0, estado.vidas)).trim() || "0";
    const carga = Math.min(100, Math.round(estado.tarefas.length / 6 * 100));
    barra.querySelector("i").style.width = `${carga}%`;
    barra.setAttribute("aria-valuenow", String(carga));
    rotuloCarga.textContent = carga < 50 ? "Estável" : carga < 84 ? "Atenção" : "Sobrecarga";
    rotuloCarga.style.color = carga < 50 ? "var(--green)" : carga < 84 ? "var(--gold)" : "var(--rose)";
  }

  function desenharFila() {
    fila.replaceChildren();
    if (!estado.tarefas.length) {
      const vazio = document.createElement("div");
      vazio.className = "empty-queue";
      vazio.textContent = estado.rodando ? "Tudo sob controle por enquanto. Aguarde novas tarefas…" : "Nenhuma tarefa pendente.";
      fila.append(vazio);
    } else {
      estado.tarefas.forEach((tarefa) => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = `task p${tarefa.prioridade}`;
        botao.dataset.id = tarefa.id;
        const nome = document.createElement("b");
        nome.textContent = tarefa.nome;
        const nivel = document.createElement("small");
        nivel.textContent = `${prioridadeTexto[tarefa.prioridade]} prioridade · clique para executar`;
        const tempo = document.createElement("i");
        botao.append(nome, nivel, tempo);
        fila.append(botao);
      });
    }
    atualizarBarras();
  }

  function encerrar(sucesso, texto) {
    if (intervalo) clearInterval(intervalo);
    intervalo = null;
    estado.rodando = false;
    botaoInicio.disabled = false;
    botaoInicio.innerHTML = sucesso ? 'Jogar novamente <span>↻</span>' : 'Tentar novamente <span>↻</span>';
    mensagem.textContent = `${sucesso ? "Pouso concluído!" : "Missão interrompida."} ${texto} Pontuação: ${estado.pontos}.`;
    desenharFila();
  }

  function passo() {
    estado.tempo = Math.max(0, estado.tempo - 0.1);
    estado.ateNova -= 0.1;
    let mudou = false;
    estado.tarefas.forEach((tarefa) => { tarefa.tempo -= 0.1; });
    estado.tarefas = estado.tarefas.filter((tarefa) => {
      if (tarefa.tempo > 0) return true;
      mudou = true;
      if (tarefa.prioridade === 3) {
        estado.vidas--;
        mensagem.textContent = `A tarefa crítica “${tarefa.nome}” expirou. Você perdeu uma vida.`;
      } else {
        estado.pontos = Math.max(0, estado.pontos - 1);
      }
      return false;
    });

    if (estado.ateNova <= 0) {
      const tarefa = TAREFAS[Math.floor(Math.random() * TAREFAS.length)];
      const duracao = tarefa.prioridade === 3 ? 6.5 : tarefa.prioridade === 2 ? 7.5 : 8.5;
      estado.tarefas.push({ ...tarefa, id: ++idTarefa, tempo: duracao, duracao });
      estado.ateNova = Math.max(0.55, 1.35 - (DURACAO - estado.tempo) / 55);
      mudou = true;
    }

    if (estado.tarefas.length > 6) {
      mudou = true;
      if ($("#g-safe").checked) {
        const ordem = [...estado.tarefas].sort((a, b) => a.prioridade - b.prioridade || a.tempo - b.tempo);
        const remover = new Set(ordem.slice(0, estado.tarefas.length - 6).map((tarefa) => tarefa.id));
        estado.tarefas = estado.tarefas.filter((tarefa) => !remover.has(tarefa.id));
        mensagem.textContent = "Alarme 1202! A proteção removeu tarefas de menor prioridade para aliviar a sobrecarga.";
      } else {
        estado.vidas = 0;
        encerrar(false, "Sem a proteção ativada, a sobrecarga impediu o sistema de continuar.");
        return;
      }
    }

    if (mudou) desenharFila();
    else atualizarBarras();
    if (estado.vidas <= 0) {
      encerrar(false, "Muitas tarefas críticas expiraram. Tente priorizar as tarefas roxas.");
      return;
    }
    if (estado.tempo <= 0) encerrar(true, "Você administrou o tempo e manteve a missão em andamento.");
  }

  fila.addEventListener("click", (evento) => {
    const botao = evento.target.closest(".task");
    if (!botao || !estado || !estado.rodando) return;
    const tarefa = estado.tarefas.find((item) => item.id === Number(botao.dataset.id));
    if (!tarefa) return;
    estado.pontos += pontosPorTarefa[tarefa.prioridade];
    estado.tarefas = estado.tarefas.filter((item) => item.id !== tarefa.id);
    mensagem.textContent = `Tarefa “${tarefa.nome}” executada. ${prioridadeTexto[tarefa.prioridade]} prioridade: +${pontosPorTarefa[tarefa.prioridade]} pontos.`;
    desenharFila();
  });

  botaoInicio.addEventListener("click", () => {
    if (intervalo) clearInterval(intervalo);
    estado = { pontos: 0, tempo: DURACAO, vidas: 3, tarefas: [], ateNova: 0, rodando: true };
    botaoInicio.disabled = true;
    botaoInicio.textContent = "Missão em andamento…";
    mensagem.textContent = "A missão começou! Dê preferência às tarefas de alta prioridade.";
    desenharFila();
    intervalo = setInterval(passo, 100);
  });
  atualizarBarras();
})();