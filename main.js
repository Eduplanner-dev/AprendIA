
  const dias = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const planoBase = [
    ['Matemática'], ['Português', 'Redação'], ['Química'], ['Biologia'],
    ['Matemática', 'Física'], ['Revisão geral'], ['Descanso']
  ];
  const planoAjustado = [
    ['Química', 'priority'], ['Química', 'priority'], ['Matemática'], ['Química', 'priority'],
    ['Biologia'], ['Revisão geral'], ['Descanso']
  ];

  const rowsEl = document.getElementById('planRows');
  const noteEl = document.getElementById('planNote');
  const btn = document.getElementById('simBtn');
  let ajustado = false;

  function buildRows(plano, marcarMudanca){
    rowsEl.innerHTML = '';
    dias.forEach((dia, i) => {
      const row = document.createElement('div');
      row.className = 'plan-row' + (marcarMudanca && JSON.stringify(plano[i]) !== JSON.stringify(planoBase[i]) ? ' changed' : '');
      const dayEl = document.createElement('span');
      dayEl.className = 'day';
      dayEl.textContent = dia;
      const chips = document.createElement('span');
      chips.className = 'chips';
      const materias = plano[i][1] === 'priority' ? [plano[i][0]] : plano[i];
      materias.forEach(m => {
        const c = document.createElement('span');
        c.className = 'chip' + (plano[i][1] === 'priority' ? ' priority' : '');
        c.textContent = m;
        chips.appendChild(c);
      });
      row.appendChild(dayEl);
      row.appendChild(chips);
      rowsEl.appendChild(row);
    });
  }

  buildRows(planoBase, false);

  btn.addEventListener('click', () => {
    ajustado = !ajustado;
    if(ajustado){
      buildRows(planoAjustado, true);
      noteEl.textContent = 'Plano atualizado — mais 3 blocos de Química essa semana';
      noteEl.classList.add('show');
      btn.textContent = 'Voltar ao plano original';
    } else {
      buildRows(planoBase, false);
      noteEl.textContent = '';
      noteEl.classList.remove('show');
      btn.textContent = 'Simular: fui mal no simulado de Química';
    }
  });

  const subjects = {
    fisica: {
      label: 'Tutor de Física',
      messages: [
        { who:'ai', text:'Vamos ver cinemática hoje. Que tal começarmos por um lançamento vertical?' },
        { who:'user', text:'Não entendi por que a velocidade fica negativa na volta.' },
        { who:'ai', text:'Boa pergunta. Usa o quadro ao lado pra desenhar, ou edita os resultados abaixo — eu te acompanho.' }
      ],
      tool:'canvas',
      calcSteps: ['v = v₀ - g·t', 'Na subida, v > 0. Na descida, v < 0.', 'No ponto mais alto, v = 0.']
    },
    matematica: {
      label: 'Tutor de Matemática',
      messages: [
        { who:'ai', text:'Vamos praticar função quadrática. Tenta montar o discriminante da equação que você trouxe.' },
        { who:'user', text:'Fico confuso se é +4ac ou -4ac.' },
        { who:'ai', text:'Escreve no quadro, ou edita os resultados abaixo, que eu vou corrigindo em tempo real.' }
      ],
      tool:'canvas',
      calcSteps: ['Δ = b² - 4ac', 'x = (-b ± √Δ) / 2a', 'Substitua a, b e c da sua equação aqui.']
    },
    quimica: {
      label: 'Tutor de Química',
      messages: [
        { who:'ai', text:'Hoje é ligação covalente. Usa a bancada ao lado pra montar uma molécula de água.' },
        { who:'user', text:'Preciso de 2 hidrogênios pra 1 oxigênio, certo?' },
        { who:'ai', text:'Isso. Adiciona os átomos, arrasta pra organizar, e clica em dois pra ligar. Dá pra ver em 3D também.' }
      ],
      tool:'bond'
    },
    biologia: {
      label: 'Tutor de Biologia',
      messages: [
        { who:'ai', text:'Vamos revisar divisão celular. Você lembra a diferença entre mitose e meiose?' },
        { who:'user', text:'Sei que uma gera células iguais e outra não, só isso.' },
        { who:'ai', text:'Bom começo. Anota no quadro ao lado os pontos que a gente for destacando.' }
      ],
      tool:'notes'
    },
    historia: {
      label: 'Tutor de História',
      messages: [
        { who:'ai', text:'Hoje é Era Vargas. Quer começar pelo Estado Novo ou pela Revolução de 30?' },
        { who:'user', text:'Revolução de 30, não lembro bem o contexto.' },
        { who:'ai', text:'Vou te explicar por partes — vai anotando as datas e nomes no quadro ao lado.' }
      ],
      tool:'notes'
    },
    portugues: {
      label: 'Tutor de Português',
      messages: [
        { who:'ai', text:'Vamos treinar redação dissertativa. Manda seu tema que eu monto uma estrutura com você.' },
        { who:'user', text:'Meu problema é a conclusão, sempre repito a introdução.' },
        { who:'ai', text:'Anota aqui uma proposta de intervenção diferente pra cada parágrafo de conclusão que praticar.' }
      ],
      tool:'notes'
    }
  };

  const chatBody = document.getElementById('chatBody');
  const chatLabel = document.getElementById('chatSubjectLabel');
  const toolPanel = document.getElementById('toolPanel');
  const tabs = document.querySelectorAll('.stab');

  function renderChat(subjectKey){
    const s = subjects[subjectKey];
    chatLabel.textContent = s.label;
    chatBody.innerHTML = '';
    s.messages.forEach(m => {
      const b = document.createElement('div');
      b.className = 'bubble ' + m.who;
      b.textContent = m.text;
      chatBody.appendChild(b);
    });
  }

  function renderTool(subjectKey){
    const s = subjects[subjectKey];
    toolPanel.innerHTML = '';
    if(s.tool === 'canvas'){
      toolPanel.innerHTML = `
        <div class="tool-head"><span class="t">Quadro de cálculo</span><button id="clearCanvas">Limpar desenho</button></div>
        <div class="calc-results" id="calcResults"></div>
        <button class="add-line-btn" id="addLine">+ Adicionar resultado</button>
        <canvas id="scratchCanvas" style="margin-top:14px;"></canvas>
        <div class="scratch-hint">Escreva com o mouse ou o dedo, ou edite os resultados acima diretamente.</div>`;
      setupCalcResults(s.calcSteps || []);
      setupCanvas();
    } else if(s.tool === 'bond'){
      toolPanel.innerHTML = `
        <div class="tool-head">
          <span class="t">Bancada de ligações</span>
          <div class="tool-head-actions">
            <button id="toggle3d">Ver em 3D</button>
            <button id="clearBonds">Limpar</button>
          </div>
        </div>
        <div class="atom-palette">
          <button class="atom-btn" data-atom="H">H</button>
          <button class="atom-btn" data-atom="O">O</button>
          <button class="atom-btn" data-atom="C">C</button>
          <button class="atom-btn" data-atom="N">N</button>
        </div>
        <div class="palette-info" id="paletteInfo">Passe o mouse ou toque num átomo pra ver os detalhes.</div>
        <div class="bond-workspace" id="bondWorkspace">
          <svg class="bond-svg" id="bondSvg"></svg>
          <div class="bond-atoms" id="bondAtoms"></div>
        </div>
        <div class="bond-hint">Adicione átomos, arraste pra organizar, e clique em dois pra ligar.</div>`;
      setupBonds();
    } else {
      toolPanel.innerHTML = `
        <div class="tool-head"><span class="t">Suas anotações</span><button id="clearNotes">Limpar</button></div>
        <div class="notes-panel" id="notesPanel" contenteditable="true" spellcheck="false"></div>
        <div class="notes-hint">Anote aqui enquanto conversa com o tutor — fica salvo só nesta visualização.</div>`;
      setupNotes(subjectKey);
    }
  }

  function setupCalcResults(steps){
    const box = document.getElementById('calcResults');
    function addLine(text){
      const line = document.createElement('div');
      line.className = 'calc-line';
      line.contentEditable = 'true';
      line.spellcheck = false;
      line.textContent = text || '';
      box.appendChild(line);
      return line;
    }
    steps.forEach(addLine);
    document.getElementById('addLine').addEventListener('click', () => {
      const line = addLine('');
      line.focus();
    });
  }

  function setupNotes(subjectKey){
    const notesDefaults = {
      biologia: 'Mitose: gera 2 células idênticas.\nMeiose: gera 4 células diferentes, com metade dos cromossomos.',
      historia: 'Revolução de 30: Getúlio Vargas assume o poder após derrota eleitoral de sua chapa.',
      portugues: 'Introdução → desenvolvimento → conclusão.\nCada conclusão deve trazer uma proposta de intervenção diferente.'
    };
    const panel = document.getElementById('notesPanel');
    panel.textContent = notesDefaults[subjectKey] || '';
    document.getElementById('clearNotes').addEventListener('click', () => {
      panel.textContent = '';
      panel.focus();
    });
  }

  function setupCanvas(){
    const canvas = document.getElementById('scratchCanvas');
    const ctx = canvas.getContext('2d');
    function resize(){
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    resize();
    window.addEventListener('resize', resize);

    let drawing = false;
    function pos(e){
      const rect = canvas.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return { x: p.clientX - rect.left, y: p.clientY - rect.top };
    }
    function start(e){ drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); }
    function move(e){ if(!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); }
    function end(){ drawing = false; }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive:false });
    canvas.addEventListener('touchmove', move, { passive:false });
    canvas.addEventListener('touchend', end);

    document.getElementById('clearCanvas').addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  const atomInfo = {
    H: { name:'Hidrogênio', number:1, valence:1 },
    O: { name:'Oxigênio', number:8, valence:2 },
    C: { name:'Carbono', number:6, valence:4 },
    N: { name:'Nitrogênio', number:7, valence:3 }
  };

  function setupBonds(){
    const atomsEl = document.getElementById('bondAtoms');
    const svg = document.getElementById('bondSvg');
    const paletteInfo = document.getElementById('paletteInfo');
    let count = 0;
    let selected = null;
    const bonds = [];
    const atomTypes = {};

    function infoText(type){
      const i = atomInfo[type];
      return type + ' — ' + i.name + ' · nº atômico ' + i.number + ' · valência ' + i.valence;
    }

    function redraw(){
      const wsRect = atomsEl.getBoundingClientRect();
      svg.innerHTML = '';
      const counts = {};
      bonds.forEach(([idA, idB]) => {
        counts[idA] = (counts[idA] || 0) + 1;
        counts[idB] = (counts[idB] || 0) + 1;
        const a = document.getElementById(idA);
        const b = document.getElementById(idB);
        if(!a || !b) return;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', ra.left - wsRect.left + ra.width/2);
        line.setAttribute('y1', ra.top - wsRect.top + ra.height/2);
        line.setAttribute('x2', rb.left - wsRect.left + rb.width/2);
        line.setAttribute('y2', rb.top - wsRect.top + rb.height/2);
        line.setAttribute('stroke', '#E8FF6B');
        line.setAttribute('stroke-width', '2.5');
        svg.appendChild(line);
      });
      Object.keys(atomTypes).forEach(id => {
        const badge = document.getElementById(id + '-count');
        if(!badge) return;
        const used = counts[id] || 0;
        const max = atomInfo[atomTypes[id]].valence;
        badge.textContent = used + '/' + max;
      });
    }

    function addAtom(type){
      count++;
      const id = 'atom-' + count;
      atomTypes[id] = type;

      const wrap = document.createElement('div');
      wrap.className = 'atom-wrap';

      const el = document.createElement('div');
      el.className = 'atom-node';
      el.id = id;
      el.dataset.type = type;
      el.textContent = type;
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'Átomo de ' + atomInfo[type].name);
      el.title = infoText(type);

      const badge = document.createElement('span');
      badge.className = 'bond-count';
      badge.id = id + '-count';
      badge.textContent = '0/' + atomInfo[type].valence;
      el.appendChild(badge);

      const label = document.createElement('span');
      label.className = 'atom-label';
      label.textContent = atomInfo[type].name;

      el.addEventListener('click', () => {
        if(selected === id){
          el.classList.remove('selected');
          selected = null;
          return;
        }
        if(selected){
          bonds.push([selected, id]);
          document.getElementById(selected).classList.remove('selected');
          selected = null;
          redraw();
        } else {
          selected = id;
          el.classList.add('selected');
        }
      });

      wrap.appendChild(el);
      wrap.appendChild(label);
      atomsEl.appendChild(wrap);
      redraw();
    }

    document.querySelectorAll('.atom-btn').forEach(btn => {
      btn.addEventListener('click', () => addAtom(btn.dataset.atom));
      btn.addEventListener('mouseenter', () => { paletteInfo.textContent = infoText(btn.dataset.atom); });
      btn.addEventListener('focus', () => { paletteInfo.textContent = infoText(btn.dataset.atom); });
    });
    document.getElementById('clearBonds').addEventListener('click', () => {
      atomsEl.innerHTML = '';
      bonds.length = 0;
      selected = null;
      redraw();
    });
    window.addEventListener('resize', redraw);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const key = tab.dataset.subject;
      renderChat(key);
      renderTool(key);
    });
  });

  renderChat('fisica');
  renderTool('fisica');
