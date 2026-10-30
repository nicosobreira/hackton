const __mods={"engine/Display":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOGICAL_HEIGHT = exports.LOGICAL_WIDTH = void 0;
exports.setupCanvas = setupCanvas;
/** Resolução LÓGICA do jogo. O canvas é escalado por CSS mantendo a proporção 16:9. */
exports.LOGICAL_WIDTH = 960;
exports.LOGICAL_HEIGHT = 540;
/**
 * Prepara o canvas: tamanho lógico fixo, nitidez em telas de alta densidade (DPR)
 * e coordenadas de desenho sempre em unidades lógicas (0..960 × 0..540).
 */
function setupCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx)
        throw new Error('Canvas 2D não é suportado neste navegador.');
    const apply = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(exports.LOGICAL_WIDTH * dpr);
        canvas.height = Math.round(exports.LOGICAL_HEIGHT * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // redimensionar o canvas zera a transformação
    };
    apply();
    window.addEventListener('resize', apply);
    return ctx;
}

},
"engine/GameLoop":function(require,module,exports){
"use strict";
/**
 * Loop principal com passo de simulação FIXO ("Fix Your Timestep").
 *
 * - `update(dt)` roda sempre com o mesmo `dt` (1 / updatesPerSecond), não importa
 *   a taxa de quadros do monitor. A simulação fica determinística: os mesmos
 *   inputs produzem sempre os mesmos resultados (bom para o escalonador do jogo).
 * - `render(alpha)` roda uma vez por quadro. `alpha` (0..1) diz quanto do próximo
 *   passo já "passou", para interpolar posições entre o estado anterior e o atual.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameLoop = void 0;
class GameLoop {
    callbacks;
    /** Duração de cada passo de simulação, em segundos. */
    step;
    /** Tempo simulado acumulado, em segundos (só avança em múltiplos de `step`). */
    simTime = 0;
    /** Número de passos de simulação executados desde o início. */
    ticks = 0;
    maxFrameTime;
    maxStepsPerFrame;
    accumulator = 0;
    lastTime = 0;
    rafId = 0;
    running = false;
    constructor(callbacks, options = {}) {
        this.callbacks = callbacks;
        this.step = 1 / (options.updatesPerSecond ?? 60);
        this.maxFrameTime = options.maxFrameTime ?? 0.25;
        this.maxStepsPerFrame = options.maxStepsPerFrame ?? 5;
    }
    get isRunning() {
        return this.running;
    }
    start() {
        if (this.running)
            return;
        this.running = true;
        this.resetClock();
        document.addEventListener('visibilitychange', this.onVisibilityChange);
        this.rafId = requestAnimationFrame(this.frame);
    }
    stop() {
        if (!this.running)
            return;
        this.running = false;
        cancelAnimationFrame(this.rafId);
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
    resetClock() {
        this.lastTime = performance.now();
        this.accumulator = 0;
    }
    /** Ao voltar para a aba, descarta o tempo em que o jogo ficou parado. */
    onVisibilityChange = () => {
        if (!document.hidden)
            this.resetClock();
    };
    frame = (now) => {
        if (!this.running)
            return;
        this.rafId = requestAnimationFrame(this.frame);
        // Tempo real desde o último quadro, limitado a [0, maxFrameTime].
        const frameTime = Math.min(Math.max((now - this.lastTime) / 1000, 0), this.maxFrameTime);
        this.lastTime = now;
        this.accumulator += frameTime;
        let steps = 0;
        while (this.accumulator >= this.step && steps < this.maxStepsPerFrame) {
            this.callbacks.update(this.step);
            this.simTime += this.step;
            this.ticks++;
            this.accumulator -= this.step;
            steps++;
        }
        // Se não deu para alcançar o tempo real, descarta o atraso em vez de acumulá-lo.
        if (this.accumulator >= this.step)
            this.accumulator = 0;
        this.callbacks.render(this.accumulator / this.step);
    };
}
exports.GameLoop = GameLoop;

},
"engine/Input":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Input = void 0;
const Display_1 = require("./Display");
/**
 * Entrada de teclado e ponteiro (mouse/toque).
 *
 * Eventos "aconteceu neste passo" (`wasPressed`, `pointer.pressed`...) valem até o
 * `endStep()`, que o loop chama DEPOIS de cada passo de simulação — e não depois de
 * cada quadro. Assim, um clique nunca se perde se um quadro rodar zero passos.
 */
class Input {
    target;
    down = new Set();
    pressed = new Set();
    released = new Set();
    /** Posição do ponteiro em coordenadas lógicas do jogo. */
    pointer = { x: 0, y: 0, down: false, pressed: false, released: false };
    constructor(target) {
        this.target = target;
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('blur', this.onBlur);
        target.addEventListener('pointerdown', this.onPointerDown);
        target.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
    }
    /** Tecla está pressionada agora. Use `event.code`: "Space", "Enter", "KeyP"... */
    isDown(code) {
        return this.down.has(code);
    }
    /** Tecla foi pressionada neste passo. */
    wasPressed(code) {
        return this.pressed.has(code);
    }
    /** Tecla foi solta neste passo. */
    wasReleased(code) {
        return this.released.has(code);
    }
    /** Limpa os eventos "deste passo". Chamado pelo loop após cada `update`. */
    endStep() {
        this.pressed.clear();
        this.released.clear();
        this.pointer.pressed = false;
        this.pointer.released = false;
    }
    onKeyDown = (e) => {
        if (e.code === 'Space' || e.code.startsWith('Arrow')) {
            // Evita rolar a página, mas preserva botões e campos focados.
            const tag = e.target?.tagName;
            if (tag !== 'BUTTON' && tag !== 'INPUT' && tag !== 'TEXTAREA')
                e.preventDefault();
        }
        if (e.repeat)
            return;
        this.down.add(e.code);
        this.pressed.add(e.code);
    };
    onKeyUp = (e) => {
        this.down.delete(e.code);
        this.released.add(e.code);
    };
    /** Ao perder o foco da janela, soltamos tudo para não "travar" teclas. */
    onBlur = () => {
        this.down.clear();
        this.pointer.down = false;
    };
    onPointerDown = (e) => {
        this.updatePointer(e);
        this.pointer.down = true;
        this.pointer.pressed = true;
    };
    onPointerMove = (e) => {
        this.updatePointer(e);
    };
    onPointerUp = (e) => {
        this.updatePointer(e);
        if (this.pointer.down)
            this.pointer.released = true;
        this.pointer.down = false;
    };
    updatePointer(e) {
        const rect = this.target.getBoundingClientRect();
        this.pointer.x = ((e.clientX - rect.left) / rect.width) * Display_1.LOGICAL_WIDTH;
        this.pointer.y = ((e.clientY - rect.top) / rect.height) * Display_1.LOGICAL_HEIGHT;
    }
}
exports.Input = Input;

},
"engine/Scene":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scene = void 0;
/**
 * Contrato de uma cena. Cada cena é uma tela/estado do jogo (título, fase, pausa...).
 *
 * `P` é o tipo dos parâmetros recebidos em `enter` (veja `SceneMap`).
 * Todos os métodos de ciclo de vida têm implementação vazia por padrão.
 */
class Scene {
    /**
     * Se verdadeiro, a cena logo abaixo na pilha continua sendo DESENHADA
     * (ex.: menu de pausa sobre a fase). Só a cena do topo recebe `update`.
     */
    transparent = false;
    /** Chamado quando a cena entra na pilha. Crie aqui elementos de UI e estado. */
    enter(_params) { }
    /** Chamado quando a cena sai da pilha. Remova aqui listeners e elementos de UI. */
    exit() { }
    /** Outra cena foi empilhada por cima desta. */
    pause() { }
    /** A cena que estava por cima saiu; esta volta a ser a do topo. */
    resume() { }
}
exports.Scene = Scene;

},
"engine/SceneManager":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneManager = void 0;
/**
 * Gerenciador de cenas em PILHA.
 *
 *  - `push`    empilha uma cena (a de baixo recebe `pause`).      Ex.: abrir a pausa.
 *  - `pop`     remove a do topo (a de baixo recebe `resume`).     Ex.: fechar a pausa.
 *  - `replace` troca a cena do topo.                              Ex.: título → fase.
 *  - `reset`   esvazia a pilha e começa de novo com uma cena.     Ex.: voltar ao menu.
 *
 * Trocas pedidas DURANTE um `update` são adiadas para o fim dele, para que a cena
 * nunca seja destruída enquanto ainda está executando.
 *
 * `M` mapeia o nome de cada cena ao tipo dos seus parâmetros (veja `SceneMap`).
 */
class SceneManager {
    stack = [];
    factories = new Map();
    queue = [];
    locked = false;
    register(name, factory) {
        this.factories.set(name, factory);
        return this;
    }
    get current() {
        return this.stack[this.stack.length - 1];
    }
    get depth() {
        return this.stack.length;
    }
    push(name, ...args) {
        this.run(() => {
            const scene = this.create(name);
            this.current?.pause();
            this.stack.push(scene);
            scene.enter(args[0]);
        });
    }
    pop() {
        this.run(() => {
            this.stack.pop()?.exit();
            this.current?.resume();
        });
    }
    replace(name, ...args) {
        this.run(() => {
            this.stack.pop()?.exit();
            const scene = this.create(name);
            this.stack.push(scene);
            scene.enter(args[0]);
        });
    }
    reset(name, ...args) {
        this.run(() => {
            while (this.stack.length > 0)
                this.stack.pop()?.exit();
            const scene = this.create(name);
            this.stack.push(scene);
            scene.enter(args[0]);
        });
    }
    /** Um passo de simulação: só a cena do topo é atualizada. */
    update(dt) {
        const top = this.current;
        if (!top)
            return;
        this.locked = true;
        try {
            top.update(dt);
        }
        finally {
            this.locked = false;
        }
        this.flush();
    }
    /** Desenha a cena do topo e, antes dela, as cenas abaixo enquanto forem transparentes. */
    render(ctx, alpha) {
        if (this.stack.length === 0)
            return;
        let first = this.stack.length - 1;
        while (first > 0 && this.stack[first]?.transparent)
            first--;
        for (let i = first; i < this.stack.length; i++) {
            this.stack[i]?.render(ctx, alpha);
        }
    }
    run(op) {
        if (this.locked)
            this.queue.push(op);
        else
            op();
    }
    flush() {
        for (const op of this.queue.splice(0))
            op();
    }
    create(name) {
        const factory = this.factories.get(name);
        if (!factory)
            throw new Error(`Cena não registrada: "${String(name)}"`);
        return factory();
    }
}
exports.SceneManager = SceneManager;

},
"game/GameContext":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"game/SceneMap":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"game/config":function(require,module,exports){
"use strict";
/**
 * TODA a configuração de balanceamento do jogo está aqui.
 * Ajuste os números, salve e jogue de novo: nenhum valor "mágico" fica espalhado no código.
 *
 * Convenção de nomes: a unidade vem no final.
 *   ...Seconds = segundos · ...Units = unidades de distância do jogo
 *   ...Ratio   = proporção (0 a 1) · ...Progress = fração do caminho até a linha (0 a 1)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.assertValidConfig = assertValidConfig;
exports.defaultConfig = {
    timeLimitSeconds: 80,
    maxStrikes: 3,
    seed: null,
    distance: {
        startUnits: 100,
        landingUnits: 0,
        failUnits: 130,
        approachPerEssentialUnits: 5,
    },
    penalties: {
        essentialTrashedUnits: 2,
        uselessOnLineUnits: 4,
        essentialOnLineUnits: 10,
        freezeAfterEssentialOnLineSeconds: 0,
    },
    memory: {
        totalBlocks: 6,
        essentialRunSeconds: [2, 4],
        uselessRunSeconds: [5, 12],
        schedule: [
            {
                label: "Muito longe",
                afterSeconds: 0,
                withinDistanceRatio: 1.0,
                blocks: 6,
            },
            { label: "Longe", afterSeconds: 15, withinDistanceRatio: 0.8, blocks: 5 },
            {
                label: "Perto",
                afterSeconds: 30,
                withinDistanceRatio: 0.55,
                blocks: 4,
            },
            {
                label: "Muito perto",
                afterSeconds: 45,
                withinDistanceRatio: 0.3,
                blocks: 3,
            },
            {
                label: "Bastante perto",
                afterSeconds: 60,
                withinDistanceRatio: 0.12,
                blocks: 2,
            },
        ],
    },
    tasks: {
        lanes: 4,
        minLaneGapProgress: 0.22,
        firstSpawnSeconds: 0.8,
        spawnJitterRatio: 0.25,
        spawnIntervalSeconds: [
            { atSeconds: 0, value: 2.2 },
            { atSeconds: 30, value: 1.5 },
            { atSeconds: 60, value: 1.1 },
        ],
        travelSeconds: [
            { atSeconds: 0, value: 7.5 },
            { atSeconds: 30, value: 6.5 },
            { atSeconds: 60, value: 5.5 },
        ],
        uselessRatio: [
            { atSeconds: 0, value: 0.4 },
            { atSeconds: 30, value: 0.45 },
            { atSeconds: 60, value: 0.5 },
        ],
    },
    alarm1202: {
        afterSeconds: 30,
        withinDistanceRatio: 0.55,
        flashIntervalSeconds: 4,
        flashSeconds: 0.2,
    },
    lander: {
        moonRadiusUnits: 30,
        orbitSpeedRadPerSecond: 0.9,
        cameraResponsePerSecond: 3,
    },
    ui: {
        resultBannerSeconds: 2.5,
    },
};
/** Confere se os números fazem sentido juntos. Lança um erro com a explicação em português. */
function assertValidConfig(config) {
    const problems = [];
    const { distance, penalties, memory, tasks } = config;
    if (config.timeLimitSeconds <= 0)
        problems.push("timeLimitSeconds deve ser maior que 0");
    if (config.maxStrikes < 1)
        problems.push("maxStrikes deve ser pelo menos 1");
    if (!(distance.landingUnits < distance.startUnits))
        problems.push("landingUnits deve ser menor que startUnits");
    if (!(distance.startUnits < distance.failUnits))
        problems.push("failUnits deve ser maior que startUnits");
    if (distance.approachPerEssentialUnits <= 0)
        problems.push("approachPerEssentialUnits deve ser maior que 0");
    if (!(penalties.essentialTrashedUnits <= penalties.uselessOnLineUnits &&
        penalties.uselessOnLineUnits < penalties.essentialOnLineUnits)) {
        problems.push("penalidades: essencial na lixeira ≤ inútil na linha < essencial na linha");
    }
    if (tasks.lanes < 1)
        problems.push("tasks.lanes deve ser pelo menos 1");
    for (const [name, [min, max]] of [
        ["essentialRunSeconds", memory.essentialRunSeconds],
        ["uselessRunSeconds", memory.uselessRunSeconds],
    ]) {
        if (min <= 0 || min > max)
            problems.push(`memory.${name} deve ser [mínimo, máximo] com 0 < mínimo ≤ máximo`);
    }
    const first = memory.schedule[0];
    if (!first ||
        first.afterSeconds !== 0 ||
        first.blocks !== memory.totalBlocks) {
        problems.push("memory.schedule deve começar em 0 s com totalBlocks blocos");
    }
    memory.schedule.forEach((stage, i) => {
        const previous = memory.schedule[i - 1];
        if (stage.blocks < 1 || stage.blocks > memory.totalBlocks)
            problems.push(`degrau "${stage.label}": blocks fora de 1..totalBlocks`);
        if (previous &&
            (stage.afterSeconds <= previous.afterSeconds ||
                stage.withinDistanceRatio >= previous.withinDistanceRatio ||
                stage.blocks > previous.blocks)) {
            problems.push(`degrau "${stage.label}": tempo deve crescer, distância e blocos devem diminuir`);
        }
    });
    for (const [name, curve] of [
        ["spawnIntervalSeconds", tasks.spawnIntervalSeconds],
        ["travelSeconds", tasks.travelSeconds],
        ["uselessRatio", tasks.uselessRatio],
    ]) {
        if (curve.length === 0)
            problems.push(`tasks.${name} precisa de pelo menos 1 ponto`);
        curve.forEach((key, i) => {
            const previous = curve[i - 1];
            if (previous && key.atSeconds <= previous.atSeconds)
                problems.push(`tasks.${name}: pontos devem estar em ordem crescente de tempo`);
        });
    }
    if (problems.length > 0)
        throw new Error(`Config inválida:\n- ${problems.join("\n- ")}`);
}

},
"game/layout":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LAYOUT = void 0;
/** Geometria da tela do jogo, em porcentagem do palco 16:9. Compartilhada entre o DOM e o canvas. */
exports.LAYOUT = {
    /** Largura do painel da memória (esquerda). O restante é o painel da nave e da Lua. */
    memoryWidthPercent: 60,
    /** Altura da "linha da morte" a partir do topo. Acima dela ficam os blocos e a lixeira. */
    lineYPercent: 31,
};

},
"game/sim/Simulation":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Simulation = void 0;
const config_1 = require("../config");
const curves_1 = require("./curves");
const rng_1 = require("./rng");
/**
 * Regras do jogo, SEM DOM e SEM canvas. Avança com `update(dt)` (dt fixo) e recebe
 * comandos do jogador (`assignToSlot`, `trashTask`, `hold`). Tudo o que acontece é
 * registrado em `drainEvents()` para a interface tocar efeitos.
 */
class Simulation {
    config;
    pool;
    rng;
    elapsedSeconds = 0;
    /** Distância atual até a Lua (veja `config.distance`). */
    distance;
    /** Quantas tarefas já tocaram a linha da morte. */
    strikes = 0;
    /** Blocos disponíveis agora. Nunca aumenta durante a partida. */
    blockCount;
    frozenRemainingSeconds = 0;
    alarmActive = false;
    alarmStartedAtSeconds = 0;
    result = null;
    tasks = [];
    slots = [];
    heldId = null;
    nextTaskId = 1;
    spawnTimerSeconds;
    events = [];
    lastDefByKind = new Map();
    constructor(config, pool, rng) {
        this.config = config;
        this.pool = pool;
        this.rng = rng;
        (0, config_1.assertValidConfig)(config);
        for (const kind of ['essential', 'useless']) {
            if (!pool.some((def) => def.kind === kind))
                throw new Error(`Faltam tarefas do tipo "${kind}" em tasks.ts`);
        }
        this.distance = config.distance.startUnits;
        this.blockCount = config.memory.totalBlocks;
        this.spawnTimerSeconds = config.tasks.firstSpawnSeconds;
        for (let index = 0; index < config.memory.totalBlocks; index++) {
            this.slots.push({ index, status: 'free', def: null, remainingSeconds: 0, totalSeconds: 0 });
        }
    }
    get remainingSeconds() {
        return Math.max(0, this.config.timeLimitSeconds - this.elapsedSeconds);
    }
    /** 1 na largada, 0 no pouso (pode passar de 1 se a nave recuar além da largada). */
    get distanceRatio() {
        const { startUnits, landingUnits } = this.config.distance;
        return (this.distance - landingUnits) / (startUnits - landingUnits);
    }
    get isFrozen() {
        return this.frozenRemainingSeconds > 0;
    }
    get heldTaskId() {
        return this.heldId;
    }
    /** Um passo de simulação. */
    update(dt) {
        if (this.result)
            return;
        this.elapsedSeconds += dt;
        this.updateFreeze(dt);
        this.updateSlots(dt);
        if (!this.result)
            this.moveTasks(dt);
        if (!this.result)
            this.spawn(dt);
        if (!this.result) {
            this.updateBlockCount();
            this.updateAlarm();
        }
        if (!this.result && this.elapsedSeconds >= this.config.timeLimitSeconds) {
            this.finish({ outcome: 'failure', reason: 'timeout' });
        }
    }
    // ───────────── comandos do jogador ─────────────
    /** Segura uma tarefa (ela para de subir) enquanto o jogador a arrasta ou a seleciona. `null` solta. */
    hold(taskId) {
        const valid = taskId !== null && !this.result && !this.isFrozen && this.tasks.some((task) => task.id === taskId);
        this.heldId = valid ? taskId : null;
    }
    /** Coloca a tarefa num bloco livre. Devolve `false` se não foi possível. */
    assignToSlot(taskId, slotIndex) {
        const task = this.findActionableTask(taskId);
        const slot = this.slots[slotIndex];
        if (!task || !slot || slot.status !== 'free')
            return false;
        const [min, max] = task.def.kind === 'essential' ? this.config.memory.essentialRunSeconds : this.config.memory.uselessRunSeconds;
        const duration = (0, rng_1.randomBetween)(this.rng, min, max);
        this.removeTask(task);
        slot.status = 'busy';
        slot.def = task.def;
        slot.remainingSeconds = duration;
        slot.totalSeconds = duration;
        this.events.push({ type: 'assigned', taskId, slot: slotIndex });
        return true;
    }
    /** Joga a tarefa na lixeira. Descartar uma essencial recua a nave "um pouco". */
    trashTask(taskId) {
        const task = this.findActionableTask(taskId);
        if (!task)
            return false;
        this.removeTask(task);
        this.events.push({ type: 'trashed', taskId, kind: task.def.kind });
        if (task.def.kind === 'essential')
            this.retreat(this.config.penalties.essentialTrashedUnits);
        return true;
    }
    /** Entrega (e esvazia) a lista de eventos desde a última chamada. */
    drainEvents() {
        return this.events.splice(0);
    }
    // ───────────── passos internos ─────────────
    updateFreeze(dt) {
        if (this.frozenRemainingSeconds <= 0)
            return;
        this.frozenRemainingSeconds -= dt;
        if (this.frozenRemainingSeconds <= 0) {
            this.frozenRemainingSeconds = 0;
            this.events.push({ type: 'unfrozen' });
        }
    }
    updateSlots(dt) {
        for (const slot of this.slots) {
            if (slot.status !== 'busy' && slot.status !== 'closing')
                continue;
            slot.remainingSeconds -= dt;
            if (slot.remainingSeconds > 0)
                continue;
            const kind = slot.def?.kind ?? 'useless';
            this.events.push({ type: 'completed', slot: slot.index, kind });
            slot.def = null;
            slot.remainingSeconds = 0;
            slot.totalSeconds = 0;
            slot.status = slot.index >= this.blockCount ? 'off' : 'free';
            if (kind === 'essential')
                this.approach();
        }
    }
    moveTasks(dt) {
        const travelSeconds = (0, curves_1.sampleCurve)(this.config.tasks.travelSeconds, this.elapsedSeconds);
        for (let i = this.tasks.length - 1; i >= 0; i--) {
            const task = this.tasks[i];
            if (!task)
                continue;
            task.prevProgress = task.progress;
            if (task.id === this.heldId)
                continue;
            task.progress += dt / travelSeconds;
            if (task.progress >= 1) {
                this.tasks.splice(i, 1);
                this.hitLine(task);
                if (this.result)
                    return;
            }
        }
    }
    hitLine(task) {
        const { penalties, maxStrikes } = this.config;
        this.strikes++;
        this.events.push({ type: 'lineHit', taskId: task.id, kind: task.def.kind });
        if (task.def.kind === 'essential') {
            this.retreat(penalties.essentialOnLineUnits);
            this.freeze();
        }
        else {
            this.retreat(penalties.uselessOnLineUnits);
        }
        if (this.strikes >= maxStrikes)
            this.finish({ outcome: 'failure', reason: 'strikes' });
    }
    freeze() {
        if (!this.isFrozen)
            this.events.push({ type: 'frozen' });
        this.frozenRemainingSeconds = Math.max(this.frozenRemainingSeconds, this.config.penalties.freezeAfterEssentialOnLineSeconds);
        this.heldId = null;
    }
    spawn(dt) {
        this.spawnTimerSeconds -= dt;
        if (this.spawnTimerSeconds > 0)
            return;
        const lane = this.pickLane();
        if (lane === null)
            return; // todas as pistas ocupadas: tenta de novo no próximo passo
        const cfg = this.config.tasks;
        const t = this.elapsedSeconds;
        const kind = this.rng() < (0, curves_1.sampleCurve)(cfg.uselessRatio, t) ? 'useless' : 'essential';
        const def = this.pickDef(kind);
        const task = { id: this.nextTaskId++, def, lane, progress: 0, prevProgress: 0 };
        this.tasks.push(task);
        this.events.push({ type: 'spawned', taskId: task.id });
        const jitter = 1 + cfg.spawnJitterRatio * (this.rng() * 2 - 1);
        this.spawnTimerSeconds = (0, curves_1.sampleCurve)(cfg.spawnIntervalSeconds, t) * jitter;
    }
    pickLane() {
        const { lanes, minLaneGapProgress } = this.config.tasks;
        const free = [];
        for (let lane = 0; lane < lanes; lane++) {
            const blocked = this.tasks.some((task) => task.lane === lane && task.progress < minLaneGapProgress);
            if (!blocked)
                free.push(lane);
        }
        return (0, rng_1.pickRandom)(this.rng, free) ?? null;
    }
    pickDef(kind) {
        const candidates = this.pool.filter((def) => def.kind === kind);
        const last = this.lastDefByKind.get(kind);
        const fresh = candidates.filter((def) => def !== last);
        const def = (0, rng_1.pickRandom)(this.rng, fresh.length > 0 ? fresh : candidates) ?? candidates[0];
        if (!def)
            throw new Error('Sem tarefas disponíveis');
        this.lastDefByKind.set(kind, def);
        return def;
    }
    updateBlockCount() {
        const byTime = this.stageBlocks((stage) => this.elapsedSeconds >= stage.afterSeconds);
        const byDistance = this.stageBlocks((stage) => this.distanceRatio <= stage.withinDistanceRatio);
        const allowed = Math.min(byTime, byDistance, this.blockCount);
        if (allowed === this.blockCount)
            return;
        this.blockCount = allowed;
        for (const slot of this.slots) {
            if (slot.index < allowed)
                continue;
            if (slot.status === 'free')
                slot.status = 'off';
            else if (slot.status === 'busy')
                slot.status = 'closing';
        }
        this.events.push({ type: 'blocksChanged', blocks: allowed });
    }
    /** Blocos do último degrau da tabela que satisfaz o critério. */
    stageBlocks(applies) {
        let blocks = this.config.memory.totalBlocks;
        for (const stage of this.config.memory.schedule)
            if (applies(stage))
                blocks = stage.blocks;
        return blocks;
    }
    updateAlarm() {
        if (this.alarmActive)
            return;
        const alarm = this.config.alarm1202;
        if (this.elapsedSeconds >= alarm.afterSeconds || this.distanceRatio <= alarm.withinDistanceRatio) {
            this.alarmActive = true;
            this.alarmStartedAtSeconds = this.elapsedSeconds;
            this.events.push({ type: 'alarmStarted' });
        }
    }
    approach() {
        const { landingUnits, approachPerEssentialUnits } = this.config.distance;
        this.distance = Math.max(landingUnits, this.distance - approachPerEssentialUnits);
        if (this.distance <= landingUnits)
            this.finish({ outcome: 'success' });
    }
    retreat(units) {
        this.distance += units;
        if (this.distance >= this.config.distance.failUnits)
            this.finish({ outcome: 'failure', reason: 'tooFar' });
    }
    finish(result) {
        if (this.result)
            return;
        this.result = result;
        this.heldId = null;
        this.events.push({ type: 'finished', result });
    }
    findActionableTask(taskId) {
        if (this.result || this.isFrozen)
            return undefined;
        return this.tasks.find((task) => task.id === taskId);
    }
    removeTask(task) {
        const index = this.tasks.indexOf(task);
        if (index >= 0)
            this.tasks.splice(index, 1);
        if (this.heldId === task.id)
            this.heldId = null;
    }
}
exports.Simulation = Simulation;

},
"game/sim/bot":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLOW_PLAYER = exports.GOOD_PLAYER = void 0;
exports.playBot = playBot;
const rng_1 = require("./rng");
exports.GOOD_PLAYER = { reactionSeconds: [0.6, 1.0], trashEssentialAtProgress: 0.6 };
exports.SLOW_PLAYER = { reactionSeconds: [1.1, 1.8], trashEssentialAtProgress: 0.6 };
const STEP_SECONDS = 1 / 60;
/** Joga uma partida inteira e devolve o resultado. `onStep` permite observar cada passo. */
function playBot(sim, rng, style, onStep) {
    let nextActionAt = 0;
    while (!sim.result) {
        sim.update(STEP_SECONDS);
        sim.drainEvents();
        onStep?.(sim);
        if (sim.result || sim.elapsedSeconds < nextActionAt || sim.isFrozen)
            continue;
        if (act(sim, style))
            nextActionAt = sim.elapsedSeconds + (0, rng_1.randomBetween)(rng, ...style.reactionSeconds);
    }
    return sim.result;
}
/** Tenta uma ação: trata primeiro a tarefa mais perto da linha. */
function act(sim, style) {
    const byUrgency = [...sim.tasks].sort((a, b) => b.progress - a.progress);
    const freeSlot = sim.slots.find((slot) => slot.status === 'free');
    for (const task of byUrgency) {
        if (task.def.kind === 'useless')
            return sim.trashTask(task.id);
        if (freeSlot)
            return sim.assignToSlot(task.id, freeSlot.index);
        if (task.progress >= style.trashEssentialAtProgress)
            return sim.trashTask(task.id);
    }
    return false;
}

},
"game/sim/curves":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleCurve = sampleCurve;
/** Valor da curva no instante `atSeconds`: interpolação linear entre pontos; antes/depois dos extremos, repete o valor do extremo. */
function sampleCurve(keyframes, atSeconds) {
    const first = keyframes[0];
    const last = keyframes[keyframes.length - 1];
    if (!first || !last)
        throw new Error('Curva sem pontos-chave');
    if (atSeconds <= first.atSeconds)
        return first.value;
    if (atSeconds >= last.atSeconds)
        return last.value;
    for (let i = 1; i < keyframes.length; i++) {
        const a = keyframes[i - 1];
        const b = keyframes[i];
        if (!a || !b || atSeconds > b.atSeconds)
            continue;
        const span = b.atSeconds - a.atSeconds;
        const k = span === 0 ? 1 : (atSeconds - a.atSeconds) / span;
        return a.value + (b.value - a.value) * k;
    }
    return last.value;
}

},
"game/sim/rng":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRng = createRng;
exports.randomBetween = randomBetween;
exports.pickRandom = pickRandom;
/** mulberry32: pequeno e determinístico. A mesma semente gera sempre a mesma partida. */
function createRng(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function randomBetween(rng, min, max) {
    return min + (max - min) * rng();
}
function pickRandom(rng, items) {
    return items[Math.floor(rng() * items.length)];
}

},
"game/sim/types":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"game/tasks":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASKS = void 0;
/**
 * Tarefas do computador de bordo (inspiradas no AGC real), em português e curtas.
 * O jogador reconhece a classe pelo NOME e pelo EMOJI (a cor sozinha nunca é a pista).
 * Para adicionar uma tarefa, acrescente uma linha: o resto do jogo se adapta.
 */
exports.TASKS = [
    // Essenciais: sem elas o pouso não acontece.
    { kind: 'essential', emoji: '🚀', name: 'Guiar a descida' },
    { kind: 'essential', emoji: '🔥', name: 'Controlar o motor' },
    { kind: 'essential', emoji: '📏', name: 'Calcular a altitude' },
    { kind: 'essential', emoji: '🧭', name: 'Manter a atitude' },
    { kind: 'essential', emoji: '📡', name: 'Ler o radar de pouso' },
    { kind: 'essential', emoji: '⏱️', name: 'Medir a velocidade' },
    // Inúteis: podem ser ignoradas sem prejudicar a missão.
    { kind: 'useless', emoji: '🛰️', name: 'Rastrear o radar de encontro' },
    { kind: 'useless', emoji: '🖥️', name: 'Atualizar o painel' },
    { kind: 'useless', emoji: '📝', name: 'Registrar a telemetria' },
    { kind: 'useless', emoji: '💡', name: 'Testar as luzes' },
    { kind: 'useless', emoji: '🕒', name: 'Ajustar o relógio' },
    { kind: 'useless', emoji: '🔋', name: 'Checar a bateria extra' },
];

},
"game/view/HudView":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HudView = void 0;
const layout_1 = require("../layout");
function el(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined)
        node.textContent = text;
    return node;
}
/** Tempo restante, alertas (toques na linha) e aviso do alarme 1202, sobre o painel da nave. */
class HudView {
    config;
    root = el('div', 'game-hud');
    timeValue = el('span', 'game-hud-time-value');
    strikesElement = el('div', 'game-hud-strikes');
    strikeMarks = [];
    alarmElement = el('div', 'game-hud-alarm', 'Alarme 1202');
    debugElement = el('pre', 'game-hud-debug');
    lastTime = -1;
    lastStrikes = -1;
    constructor(parent, config, debug) {
        this.config = config;
        this.root.style.setProperty('--memory-width', `${layout_1.LAYOUT.memoryWidthPercent}%`);
        const time = el('div', 'game-hud-time');
        time.append(el('span', 'game-hud-time-label', 'Tempo'), this.timeValue);
        this.strikesElement.setAttribute('role', 'img');
        for (let i = 0; i < config.maxStrikes; i++) {
            const mark = el('i', 'strike');
            this.strikeMarks.push(mark);
            this.strikesElement.append(mark);
        }
        this.alarmElement.hidden = true;
        this.debugElement.hidden = !debug;
        this.root.append(time, this.strikesElement, this.alarmElement, this.debugElement);
        parent.append(this.root);
    }
    destroy() {
        this.root.remove();
    }
    render(sim) {
        const seconds = Math.ceil(sim.remainingSeconds);
        if (seconds !== this.lastTime) {
            this.lastTime = seconds;
            this.timeValue.textContent = String(seconds);
        }
        if (sim.strikes !== this.lastStrikes) {
            this.lastStrikes = sim.strikes;
            this.strikeMarks.forEach((mark, i) => mark.classList.toggle('is-on', i < sim.strikes));
            this.strikesElement.setAttribute('aria-label', `Alertas: ${sim.strikes} de ${this.config.maxStrikes}`);
        }
        this.alarmElement.hidden = !sim.alarmActive || sim.result !== null;
        if (!this.debugElement.hidden) {
            this.debugElement.textContent =
                `t ${sim.elapsedSeconds.toFixed(1)}s  dist ${sim.distance.toFixed(1)}\n` +
                    `blocos ${sim.blockCount}  tarefas ${sim.tasks.length}  alertas ${sim.strikes}`;
        }
    }
}
exports.HudView = HudView;

},
"game/view/LanderView":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanderView = void 0;
const Display_1 = require("../../engine/Display");
const layout_1 = require("../layout");
const rng_1 = require("../sim/rng");
const SPACE = '#382440';
const MOON = '#eee5f0';
const CRATER = '#c7accd';
const MODULE_BODY = '#c89b4a';
const MODULE_DETAIL = '#382440';
const GOOD_FLASH = '94, 177, 191';
const BAD_FLASH = '229, 72, 77';
/** Raio (px) da órbita na tela: constante, quem muda é o zoom da câmera. */
const ORBIT_SCREEN_RADIUS_PX = 150;
const FLASH_SECONDS = 0.5;
const STAR_COUNT = 50;
/**
 * Painel da nave e da Lua, em canvas, só com formas geométricas.
 * O módulo orbita a Lua em círculo. A câmera se aproxima conforme a distância diminui:
 * a órbita fica sempre do mesmo tamanho na tela, e a Lua cresce, então o módulo nunca sai do painel.
 */
class LanderView {
    config;
    left = (Display_1.LOGICAL_WIDTH * layout_1.LAYOUT.memoryWidthPercent) / 100;
    width = Display_1.LOGICAL_WIDTH - this.left;
    centerX = this.left + this.width / 2;
    centerY = Display_1.LOGICAL_HEIGHT * 0.56;
    stars = [];
    distance;
    prevDistance;
    angle = 0;
    prevAngle = 0;
    flashRemaining = 0;
    flashColor = GOOD_FLASH;
    constructor(config, startDistance) {
        this.config = config;
        this.distance = this.prevDistance = startDistance;
        const rng = (0, rng_1.createRng)(7);
        for (let i = 0; i < STAR_COUNT; i++) {
            this.stars.push({ x: this.left + rng() * this.width, y: rng() * Display_1.LOGICAL_HEIGHT, size: 1 + rng() * 1.5 });
        }
    }
    /** Um passo: a câmera "persegue" a distância real, suavemente. */
    update(dt, targetDistance) {
        this.prevDistance = this.distance;
        this.prevAngle = this.angle;
        const follow = 1 - Math.exp(-dt * this.config.lander.cameraResponsePerSecond);
        this.distance += (targetDistance - this.distance) * follow;
        this.angle += this.config.lander.orbitSpeedRadPerSecond * dt;
        this.flashRemaining = Math.max(0, this.flashRemaining - dt);
    }
    handleEvents(events) {
        for (const event of events) {
            if (event.type === 'completed' && event.kind === 'essential')
                this.flash(GOOD_FLASH);
            else if (event.type === 'lineHit' || (event.type === 'trashed' && event.kind === 'essential'))
                this.flash(BAD_FLASH);
        }
    }
    render(ctx, alpha) {
        const distance = this.prevDistance + (this.distance - this.prevDistance) * alpha;
        const angle = this.prevAngle + (this.angle - this.prevAngle) * alpha;
        const { moonRadiusUnits } = this.config.lander;
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.left, 0, this.width, Display_1.LOGICAL_HEIGHT);
        ctx.clip();
        ctx.fillStyle = SPACE;
        ctx.fillRect(this.left, 0, this.width, Display_1.LOGICAL_HEIGHT);
        ctx.fillStyle = 'rgba(251, 246, 242, 0.55)';
        for (const star of this.stars)
            ctx.fillRect(star.x, star.y, star.size, star.size);
        // Zoom: a órbita (Lua + distância) sempre ocupa ORBIT_SCREEN_RADIUS_PX na tela.
        const orbitWorldRadius = moonRadiusUnits + Math.max(0, distance);
        const scale = ORBIT_SCREEN_RADIUS_PX / orbitWorldRadius;
        const moonRadius = moonRadiusUnits * scale;
        this.drawOrbit(ctx);
        this.drawMoon(ctx, moonRadius, angle);
        this.drawModule(ctx, angle);
        this.drawFlash(ctx);
        ctx.restore();
    }
    flash(color) {
        this.flashColor = color;
        this.flashRemaining = FLASH_SECONDS;
    }
    drawOrbit(ctx) {
        ctx.strokeStyle = 'rgba(224, 205, 225, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, ORBIT_SCREEN_RADIUS_PX, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    drawMoon(ctx, radius, angle) {
        ctx.fillStyle = MOON;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        // Crateras: círculos que giram devagar com a Lua.
        ctx.fillStyle = CRATER;
        const spin = angle * 0.15;
        for (const [dx, dy, size] of [[0.35, -0.25, 0.22], [-0.3, 0.2, 0.3], [0.1, 0.45, 0.14]]) {
            const x = dx * Math.cos(spin) - dy * Math.sin(spin);
            const y = dx * Math.sin(spin) + dy * Math.cos(spin);
            ctx.beginPath();
            ctx.arc(this.centerX + x * radius, this.centerY + y * radius, size * radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    /** Módulo de pouso: corpo, janela e duas pernas, com os "pés" voltados para a Lua. */
    drawModule(ctx, angle) {
        ctx.save();
        ctx.translate(this.centerX + Math.cos(angle) * ORBIT_SCREEN_RADIUS_PX, this.centerY + Math.sin(angle) * ORBIT_SCREEN_RADIUS_PX);
        ctx.rotate(angle + Math.PI / 2);
        ctx.strokeStyle = MODULE_BODY;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-7, 4);
        ctx.lineTo(-13, 11);
        ctx.moveTo(7, 4);
        ctx.lineTo(13, 11);
        ctx.stroke();
        ctx.fillStyle = MODULE_BODY;
        ctx.fillRect(-8, -9, 16, 14);
        ctx.fillStyle = MODULE_DETAIL;
        ctx.fillRect(-3, -6, 6, 5);
        ctx.restore();
    }
    drawFlash(ctx) {
        if (this.flashRemaining <= 0)
            return;
        ctx.strokeStyle = `rgba(${this.flashColor}, ${this.flashRemaining / FLASH_SECONDS})`;
        ctx.lineWidth = 6;
        ctx.strokeRect(this.left + 3, 3, this.width - 6, Display_1.LOGICAL_HEIGHT - 6);
    }
}
exports.LanderView = LanderView;

},
"game/view/MemoryView":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryView = void 0;
const layout_1 = require("../layout");
/** Quanto o ponteiro pode andar (px) e ainda contar como "toque" em vez de arrastar. */
const TAP_TOLERANCE_PX = 8;
/** Folga (px) ao redor de blocos e lixeira para facilitar soltar a tarefa. */
const DROP_MARGIN_PX = 10;
function el(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined)
        node.textContent = text;
    return node;
}
/**
 * Painel da memória do Executive, em DOM: blocos, lixeira, linha da morte e tarefas.
 * Funciona com mouse e toque: ARRASTAR uma tarefa até um bloco/lixeira, ou TOCAR na tarefa
 * (ela fica selecionada e parada) e depois tocar no destino.
 */
class MemoryView {
    config;
    actions;
    root = el('section', 'memory');
    layer = el('div', 'task-layer');
    trashElement = el('div', 'trash');
    slotElements = [];
    slotKeys = [];
    slotBars = [];
    lockElement = el('div', 'memory-lock', 'Travado');
    lineElement = el('div', 'deathline');
    taskElements = new Map();
    interaction = null;
    selectedId = null;
    enabled = true;
    constructor(parent, config, actions) {
        this.config = config;
        this.actions = actions;
        this.root.setAttribute('aria-label', 'Memória do Executive');
        this.root.style.setProperty('--line-y', `${layout_1.LAYOUT.lineYPercent}%`);
        this.root.style.setProperty('--memory-width', `${layout_1.LAYOUT.memoryWidthPercent}%`);
        const top = el('div', 'memory-top');
        const slots = el('div', 'slots');
        for (let index = 0; index < config.memory.totalBlocks; index++) {
            const slot = el('div', 'slot slot--free');
            slot.dataset.slot = String(index);
            const emoji = el('span', 'slot-emoji');
            const bar = el('span', 'slot-bar');
            const fill = el('i', 'slot-fill');
            bar.append(fill);
            slot.append(emoji, bar);
            slot.addEventListener('click', () => this.tapTarget({ kind: 'slot', index }));
            slots.append(slot);
            this.slotElements.push(slot);
            this.slotBars.push(fill);
            this.slotKeys.push('');
        }
        this.trashElement.append(el('span', 'trash-emoji', '🗑️'), el('span', 'trash-label', 'Lixeira'));
        this.trashElement.addEventListener('click', () => this.tapTarget({ kind: 'trash' }));
        top.append(slots, this.trashElement);
        this.root.append(top, this.lineElement, this.layer, this.lockElement);
        parent.append(this.root);
    }
    destroy() {
        this.root.remove();
        this.taskElements.clear();
    }
    /** Efeitos visuais curtos a partir dos eventos da simulação. */
    handleEvents(events) {
        for (const event of events) {
            if (event.type === 'lineHit')
                this.pulse(this.lineElement, 'is-hit');
            else if (event.type === 'completed')
                this.pulse(this.slotElements[event.slot], event.kind === 'essential' ? 'is-done' : 'is-wasted');
            else if (event.type === 'trashed')
                this.pulse(this.trashElement, 'is-used');
        }
    }
    render(sim, alpha) {
        const over = sim.result !== null;
        this.enabled = !over && !sim.isFrozen;
        if (!this.enabled && (this.interaction || this.selectedId !== null))
            this.cancelInteraction();
        const alarm = this.config.alarm1202;
        const flashing = sim.alarmActive && (sim.elapsedSeconds - sim.alarmStartedAtSeconds) % alarm.flashIntervalSeconds < alarm.flashSeconds;
        this.root.classList.toggle('is-frozen', sim.isFrozen);
        this.root.classList.toggle('is-over', over);
        this.root.classList.toggle('is-alarm', sim.alarmActive && !over);
        this.root.classList.toggle('is-flashing', flashing && !over);
        this.syncTasks(sim.tasks, alpha);
        this.renderSlots(sim.slots);
    }
    // ───────────── desenho ─────────────
    syncTasks(tasks, alpha) {
        const alive = new Set();
        const heldId = this.heldId();
        for (const task of tasks) {
            alive.add(task.id);
            let element = this.taskElements.get(task.id);
            if (!element) {
                element = this.createTask(task);
                this.taskElements.set(task.id, element);
                this.layer.append(element);
            }
            element.classList.toggle('is-held', task.id === heldId);
            element.classList.toggle('is-selected', task.id === this.selectedId);
            if (this.interaction?.taskId === task.id && this.interaction.moved)
                continue; // quem arrasta manda na posição
            const progress = task.prevProgress + (task.progress - task.prevProgress) * alpha;
            element.style.left = `${((task.lane + 0.5) / this.config.tasks.lanes) * 100}%`;
            element.style.top = `${layout_1.LAYOUT.lineYPercent + (1 - progress) * (100 - layout_1.LAYOUT.lineYPercent)}%`;
        }
        for (const [id, element] of this.taskElements) {
            if (alive.has(id))
                continue;
            element.remove();
            this.taskElements.delete(id);
            if (this.selectedId === id)
                this.selectedId = null;
            if (this.interaction?.taskId === id)
                this.interaction = null;
        }
    }
    renderSlots(slots) {
        const holding = this.heldId() !== null;
        for (const slot of slots) {
            const element = this.slotElements[slot.index];
            const bar = this.slotBars[slot.index];
            if (!element || !bar)
                continue;
            const canDrop = holding && slot.status === 'free';
            const key = `${slot.status}|${slot.def?.emoji ?? ''}|${canDrop}`;
            if (this.slotKeys[slot.index] !== key) {
                this.slotKeys[slot.index] = key;
                element.className = `slot slot--${slot.status}${canDrop ? ' can-drop' : ''}`;
                const emoji = element.firstElementChild;
                if (emoji)
                    emoji.textContent = slot.def?.emoji ?? (slot.status === 'off' ? '✕' : '');
                element.setAttribute('aria-label', `Bloco ${slot.index + 1}: ${slot.def?.name ?? labelOf(slot.status)}`);
            }
            const ratio = slot.totalSeconds > 0 ? slot.remainingSeconds / slot.totalSeconds : 0;
            bar.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
        }
        this.trashElement.classList.toggle('can-drop', holding);
    }
    createTask(task) {
        const card = el('div', 'task');
        card.dataset.taskId = String(task.id);
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', task.def.name);
        card.append(el('span', 'task-emoji', task.def.emoji), el('span', 'task-name', task.def.name));
        card.addEventListener('pointerdown', (event) => this.onPointerDown(event, task.id, card));
        card.addEventListener('pointermove', (event) => this.onPointerMove(event));
        card.addEventListener('pointerup', (event) => this.onPointerUp(event));
        card.addEventListener('pointercancel', () => this.cancelInteraction());
        return card;
    }
    pulse(element, className) {
        if (!element)
            return;
        element.classList.remove(className);
        void element.offsetWidth; // reinicia a animação CSS
        element.classList.add(className);
        element.addEventListener('animationend', () => element.classList.remove(className), { once: true });
    }
    // ───────────── interação (mouse e toque) ─────────────
    heldId() {
        return this.interaction?.taskId ?? this.selectedId;
    }
    syncHold() {
        this.actions.hold(this.heldId());
    }
    onPointerDown(event, taskId, element) {
        if (!this.enabled || this.interaction || event.button > 0)
            return;
        event.preventDefault();
        element.setPointerCapture?.(event.pointerId);
        this.interaction = { taskId, element, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
        this.syncHold();
    }
    onPointerMove(event) {
        const it = this.interaction;
        if (!it || event.pointerId !== it.pointerId)
            return;
        if (!it.moved && Math.hypot(event.clientX - it.startX, event.clientY - it.startY) > TAP_TOLERANCE_PX) {
            it.moved = true;
            it.element.classList.add('is-dragging');
        }
        if (it.moved) {
            const rect = this.root.getBoundingClientRect();
            it.element.style.left = `${event.clientX - rect.left}px`;
            it.element.style.top = `${event.clientY - rect.top}px`;
        }
    }
    onPointerUp(event) {
        const it = this.interaction;
        if (!it || event.pointerId !== it.pointerId)
            return;
        this.interaction = null;
        it.element.classList.remove('is-dragging');
        it.element.releasePointerCapture?.(it.pointerId);
        if (!it.moved) {
            // Toque: seleciona (a tarefa fica parada) ou, tocando de novo, solta.
            this.selectedId = this.selectedId === it.taskId ? null : it.taskId;
            this.syncHold();
            return;
        }
        // Arrasto: tenta soltar no destino sob o ponteiro; se não der, a tarefa volta a subir.
        const target = this.targetAt(event.clientX, event.clientY);
        this.selectedId = null;
        if (!target || !this.perform(it.taskId, target)) {
            it.element.classList.add('is-rejected');
            it.element.addEventListener('animationend', () => it.element.classList.remove('is-rejected'), { once: true });
        }
        this.syncHold();
    }
    /** Toque num bloco ou na lixeira com uma tarefa selecionada. */
    tapTarget(target) {
        if (!this.enabled || this.interaction || this.selectedId === null)
            return;
        if (this.perform(this.selectedId, target))
            this.selectedId = null;
        this.syncHold();
    }
    perform(taskId, target) {
        return target.kind === 'slot' ? this.actions.assign(taskId, target.index) : this.actions.trash(taskId);
    }
    cancelInteraction() {
        this.interaction?.element.classList.remove('is-dragging');
        this.interaction = null;
        this.selectedId = null;
        this.syncHold();
    }
    targetAt(clientX, clientY) {
        const inside = (element) => {
            const rect = element.getBoundingClientRect();
            return (clientX >= rect.left - DROP_MARGIN_PX &&
                clientX <= rect.right + DROP_MARGIN_PX &&
                clientY >= rect.top - DROP_MARGIN_PX &&
                clientY <= rect.bottom + DROP_MARGIN_PX);
        };
        if (inside(this.trashElement))
            return { kind: 'trash' };
        const index = this.slotElements.findIndex(inside);
        return index >= 0 ? { kind: 'slot', index } : null;
    }
}
exports.MemoryView = MemoryView;
function labelOf(status) {
    if (status === 'free')
        return 'livre';
    if (status === 'off')
        return 'indisponível';
    return 'ocupado';
}

},
"main":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./styles/main.css");
require("./styles/game.css");
const Display_1 = require("./engine/Display");
const GameLoop_1 = require("./engine/GameLoop");
const Input_1 = require("./engine/Input");
const SceneManager_1 = require("./engine/SceneManager");
const EndingScene_1 = require("./scenes/EndingScene");
const GameScene_1 = require("./scenes/GameScene");
const TitleScene_1 = require("./scenes/TitleScene");
function getElement(selector) {
    const element = document.querySelector(selector);
    if (!element)
        throw new Error(`Elemento não encontrado: ${selector}`);
    return element;
}
const canvas = getElement('#game');
const ui = getElement('#ui');
const ctx = (0, Display_1.setupCanvas)(canvas);
const game = {
    canvas,
    ui,
    input: new Input_1.Input(canvas),
    scenes: new SceneManager_1.SceneManager(),
};
// Registro das cenas. Cada fábrica recebe o contexto por fechamento.
game.scenes
    .register('title', () => new TitleScene_1.TitleScene(game))
    .register('game', () => new GameScene_1.GameScene(game))
    .register('ending', () => new EndingScene_1.EndingScene(game));
game.scenes.reset('title');
// Atalho de desenvolvimento: abrir direto no jogo com `?scene=game`.
if (new URLSearchParams(window.location.search).get('scene') === 'game')
    game.scenes.push('game');
const loop = new GameLoop_1.GameLoop({
    update(dt) {
        game.scenes.update(dt);
        game.input.endStep(); // eventos "deste passo" acabam aqui
    },
    render(alpha) {
        ctx.clearRect(0, 0, Display_1.LOGICAL_WIDTH, Display_1.LOGICAL_HEIGHT);
        game.scenes.render(ctx, alpha);
    },
}, { updatesPerSecond: 60 });
loop.start();

},
"scenes/EndingScene":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndingScene = void 0;
const Display_1 = require("../engine/Display");
const Scene_1 = require("../engine/Scene");
/** Tela final acessível após qualquer resultado da partida. */
class EndingScene extends Scene_1.Scene {
    game;
    panel = null;
    constructor(game) {
        super();
        this.game = game;
    }
    enter(params) {
        const success = params.result === 'success';
        const panel = document.createElement('section');
        panel.className = 'panel ending-panel';
        panel.setAttribute('aria-label', 'Resultado da missão');
        const eyebrow = document.createElement('span');
        eyebrow.className = 'ending-eyebrow';
        eyebrow.textContent = 'MISSÃO APOLLO · RESULTADO';
        const heading = document.createElement('h2');
        heading.textContent = success ? 'Missão concluída!' : 'A missão terminou';
        const message = document.createElement('p');
        message.textContent = success
            ? 'Você ajudou a priorizar as tarefas essenciais. Que tal viver a missão novamente?'
            : 'Nem toda missão sai como planejado. Tente outra vez e descubra novas estratégias!';
        const actions = document.createElement('div');
        actions.className = 'ending-actions';
        const replay = document.createElement('button');
        replay.type = 'button';
        replay.className = 'button';
        replay.textContent = '↻ Jogar novamente';
        replay.addEventListener('click', () => this.game.scenes.reset('game'));
        const home = document.createElement('button');
        home.type = 'button';
        home.className = 'button button-secondary';
        home.textContent = '⌂ Voltar ao início';
        home.addEventListener('click', () => this.game.scenes.reset('title'));
        actions.append(replay, home);
        panel.append(eyebrow, heading, message, actions);
        this.game.ui.append(panel);
        this.panel = panel;
        replay.focus();
    }
    exit() { this.panel?.remove(); this.panel = null; }
    update() { }
    render(ctx) {
        ctx.fillStyle = '#382440';
        ctx.fillRect(0, 0, Display_1.LOGICAL_WIDTH, Display_1.LOGICAL_HEIGHT);
    }
}
exports.EndingScene = EndingScene;

},
"scenes/GameScene":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameScene = void 0;
const Display_1 = require("../engine/Display");
const Scene_1 = require("../engine/Scene");
const config_1 = require("../game/config");
const rng_1 = require("../game/sim/rng");
const Simulation_1 = require("../game/sim/Simulation");
const tasks_1 = require("../game/tasks");
const HudView_1 = require("../game/view/HudView");
const LanderView_1 = require("../game/view/LanderView");
const MemoryView_1 = require("../game/view/MemoryView");
const BACKGROUND = '#382440';
/** Em celular na vertical o jogo pausa e aparece o aviso "gire o aparelho". */
const PORTRAIT_TOUCH_QUERY = '(orientation: portrait) and (pointer: coarse)';
/**
 * Cena do jogo: gerenciamento da memória do Executive + módulo de pouso e Lua.
 * Abra com `scenes.push('game')`. Ao terminar, mostra "Missão Concluída" ou "Missão Falhou"
 * e chama `scenes.replace('ending', { result })`.
 *
 * Parâmetros de URL úteis para ajustar o jogo: `?seed=123` (mesma partida) e `?debug` (números na tela).
 */
class GameScene extends Scene_1.Scene {
    game;
    config;
    run = null;
    constructor(game, config = config_1.defaultConfig) {
        super();
        this.game = game;
        this.config = config;
    }
    /** Só para testes e depuração. */
    get simulation() {
        return this.run?.sim ?? null;
    }
    enter() {
        const params = new URLSearchParams(window.location.search);
        const seedParam = Number(params.get('seed'));
        const seed = params.has('seed') && Number.isFinite(seedParam) ? seedParam : (this.config.seed ?? Math.floor(Math.random() * 2 ** 32));
        const sim = new Simulation_1.Simulation(this.config, tasks_1.TASKS, (0, rng_1.createRng)(seed));
        const memory = new MemoryView_1.MemoryView(this.game.ui, this.config, {
            hold: (id) => sim.hold(id),
            assign: (id, slot) => sim.assignToSlot(id, slot),
            trash: (id) => sim.trashTask(id),
        });
        const hud = new HudView_1.HudView(this.game.ui, this.config, params.has('debug'));
        const lander = new LanderView_1.LanderView(this.config, this.config.distance.startUnits);
        const banner = document.createElement('div');
        banner.className = 'result-banner';
        banner.setAttribute('role', 'status');
        banner.hidden = true;
        this.game.ui.append(banner);
        document.body.classList.add('in-game');
        this.run = { sim, memory, lander, hud, banner, bannerRemainingSeconds: null };
    }
    exit() {
        this.run?.memory.destroy();
        this.run?.hud.destroy();
        this.run?.banner.remove();
        this.run = null;
        document.body.classList.remove('in-game');
    }
    update(dt) {
        const run = this.run;
        if (!run)
            return;
        if (run.bannerRemainingSeconds !== null) {
            run.lander.update(dt, run.sim.distance);
            run.bannerRemainingSeconds -= dt;
            if (run.bannerRemainingSeconds <= 0)
                this.finish(run);
            return;
        }
        if (this.isRotateHintShowing())
            return; // sem jogar (e sem o tempo correr) com o aviso na tela
        run.sim.update(dt);
        run.lander.update(dt, run.sim.distance);
        const events = run.sim.drainEvents();
        run.memory.handleEvents(events);
        run.lander.handleEvents(events);
        if (run.sim.result) {
            run.banner.hidden = false;
            run.banner.classList.add(run.sim.result.outcome === 'success' ? 'is-success' : 'is-failure');
            run.banner.textContent = run.sim.result.outcome === 'success' ? 'Missão Concluída' : 'Missão Falhou';
            run.bannerRemainingSeconds = this.config.ui.resultBannerSeconds;
        }
    }
    render(ctx, alpha) {
        const run = this.run;
        ctx.fillStyle = BACKGROUND;
        ctx.fillRect(0, 0, Display_1.LOGICAL_WIDTH, Display_1.LOGICAL_HEIGHT);
        if (!run)
            return;
        run.lander.render(ctx, alpha);
        run.memory.render(run.sim, alpha);
        run.hud.render(run.sim);
    }
    finish(run) {
        const result = run.sim.result;
        if (!result)
            return;
        run.bannerRemainingSeconds = Number.POSITIVE_INFINITY; // evita chamar duas vezes
        this.game.scenes.replace('ending', { result: result.outcome });
    }
    isRotateHintShowing() {
        return typeof window.matchMedia === 'function' && window.matchMedia(PORTRAIT_TOUCH_QUERY).matches;
    }
}
exports.GameScene = GameScene;

},
"scenes/TitleScene":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TitleScene = void 0;
const Display_1 = require("../engine/Display");
const Scene_1 = require("../engine/Scene");
/** Tela inicial de DESENVOLVIMENTO: só abre o jogo. O menu real é da história. */
class TitleScene extends Scene_1.Scene {
    game;
    panel = null;
    time = 0;
    constructor(game) {
        super();
        this.game = game;
    }
    enter() {
        const panel = document.createElement('div');
        panel.className = 'panel title-panel';
        const heading = document.createElement("h1");
        heading.textContent = "Hamilton: o software da Apollo";
        heading.align = "center";
        const start = document.createElement("button");
        start.className = "button";
        start.textContent = "Começar o jogo";
        start.addEventListener("click", () => this.start());
        panel.append(heading, start);
        this.game.ui.append(panel);
        this.panel = panel;
        start.focus();
    }
    exit() {
        this.panel?.remove();
        this.panel = null;
    }
    /** O jogo foi empilhado por cima: esconde o painel (ele continua na pilha, por baixo). */
    pause() {
        if (this.panel)
            this.panel.hidden = true;
    }
    resume() {
        if (this.panel)
            this.panel.hidden = false;
    }
    update(dt) {
        this.time += dt;
        if (this.game.input.wasPressed('Enter'))
            this.start();
    }
    render(ctx) {
        ctx.fillStyle = '#382440';
        ctx.fillRect(0, 0, Display_1.LOGICAL_WIDTH, Display_1.LOGICAL_HEIGHT);
        // Linha pulsante, só para mostrar que o canvas está sendo desenhado.
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 2);
        ctx.fillStyle = `rgba(200, 155, 74, ${0.25 + 0.5 * pulse})`;
        ctx.fillRect(0, Display_1.LOGICAL_HEIGHT - 6, Display_1.LOGICAL_WIDTH, 6);
    }
    start() {
        this.game.scenes.push('game');
    }
}
exports.TitleScene = TitleScene;

}};const __cache={};function __load(id){if(__cache[id])return __cache[id].exports;const m={exports:{}};__cache[id]=m;const req=(p)=>{if(p.endsWith('.css'))return {};const seg=id.split('/');seg.pop();for(const s of p.split('/')){if(s==='..')seg.pop();else if(s!=='.')seg.push(s)}return __load(seg.join('/'));};if(!__mods[id])throw Error('Module missing '+id);__mods[id](req,m,m.exports);return m.exports;}__load('main');