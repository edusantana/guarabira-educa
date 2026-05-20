console.log('[educa] ===== SCRIPT CARREGADO =====');
console.log('[educa] href:', window.location.href);

const HASH_REGISTRO_DIARIO = /^#\/diarioescolar\/turma\/\d+\/registrodiario\/etapa\/\d+\/componente\/\d+/;
const HASH_TURMA = /^#\/diarioescolar\/turma\/\d+$/;

function isPaginaRegistroDiario() {
  return HASH_REGISTRO_DIARIO.test(window.location.hash);
}

function isPaginaTurma() {
  return HASH_TURMA.test(window.location.hash);
}

function paginaAtual() {
  if (isPaginaRegistroDiario()) return 'registro-diario';
  if (isPaginaTurma()) return 'turma';
  return null;
}

function criaPainel() {
  if (document.getElementById('extensao-guarabira-educa')) return;

  var ancora = document.querySelector('.barra-menu');
  if (!ancora) {
    console.log('[educa] .barra-menu ainda não existe, aguardando...');
    return;
  }

  console.log('[educa] criaPainel — injetando antes de .barra-menu');

  var painel = document.createElement('div');
  painel.id = 'extensao-guarabira-educa';
  painel.style.cssText = 'background:#1a1a2e;padding:8px 12px;display:flex;flex-direction:column;gap:6px;border-bottom:2px solid #e94560;';

  painel.innerHTML = `
    <textarea
      id="educa-registros"
      rows="6"
      placeholder="Cole aqui os registros"
      style="width:100%;box-sizing:border-box;background:#0f3460;color:#eee;border:1px solid #e94560;border-radius:4px;padding:6px;font-family:monospace;font-size:13px;resize:vertical;"
    ></textarea>
    <button id="educa-copiar" style="align-self:flex-start;background:#e94560;color:#fff;border:none;border-radius:4px;padding:6px 18px;cursor:pointer;font-size:13px;">Copiar</button>
  `;

  ancora.parentNode.insertBefore(painel, ancora);
  console.log('[educa] painel injetado');

  document.getElementById('educa-copiar').addEventListener('click', function () {
    var texto = document.getElementById('educa-registros').value;
    navigator.clipboard.writeText(texto).then(function () {
      console.log('[educa] texto copiado para clipboard');
    });
  });
}

function injetaBotaoCopiarExcluir() {
  if (document.getElementById('educa-copiar-excluir')) return;

  var btnExcluir = document.querySelector('app-diario-escolar-turma-registro-diario .p-button-danger');
  if (!btnExcluir) return;

  var container = btnExcluir.parentNode;
  var btn = document.createElement('button');
  btn.id = 'educa-copiar-excluir';
  btn.innerHTML = '<u>C</u>opiar';
  btn.accessKey = 'c';
  btn.title = 'ALT+C — Copia o conteúdo dos editores para a área de transferência interna';
  btn.style.cssText = 'background:#2b58a1;color:#fff;border:none;border-radius:4px;padding:6px 18px;cursor:pointer;font-size:14px;';

  var btnLimpar = document.createElement('button');
  btnLimpar.id = 'educa-limpar-excluir';
  btnLimpar.innerHTML = 'Li<u>m</u>par';
  btnLimpar.accessKey = 'm';
  btnLimpar.title = 'ALT+M — Remove o conteúdo salvo da área de transferência interna';
  btnLimpar.style.cssText = 'background:#6c757d;color:#fff;border:none;border-radius:4px;padding:6px 18px;cursor:pointer;font-size:14px;';

  var btnColar = document.createElement('button');
  btnColar.id = 'educa-colar-excluir';
  btnColar.innerHTML = 'Colar [<u>v</u>]';
  btnColar.accessKey = 'v';
  btnColar.title = 'ALT+V — Cola o conteúdo salvo nos editores deste registro';
  btnColar.style.cssText = 'background:#28a745;color:#fff;border:none;border-radius:4px;padding:6px 18px;cursor:pointer;font-size:14px;';

  var btnDividir = document.createElement('button');
  btnDividir.id = 'educa-dividir-excluir';
  btnDividir.innerHTML = 'Div<u>i</u>dir em 3';
  btnDividir.accessKey = 'i';
  btnDividir.title = 'ALT+I — Divide o texto do primeiro editor em frases (pelo ".") e distribui nos demais editores';
  btnDividir.style.cssText = 'background:#fd7e14;color:#fff;border:none;border-radius:4px;padding:6px 18px;cursor:pointer;font-size:14px;';

  var wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;gap:8px;margin-right:auto;';
  wrapper.appendChild(btn);
  wrapper.appendChild(btnLimpar);
  wrapper.appendChild(btnColar);
  wrapper.appendChild(btnDividir);

  container.insertBefore(wrapper, btnExcluir);
  console.log('[educa] botões Copiar, Limpar e Colar injetados à esquerda');

  var btnSalvar = document.querySelector('app-diario-escolar-turma-registro-diario .salvar-fab');
  if (btnSalvar) {
    btnSalvar.accessKey = 's';
    btnSalvar.title = 'Tecla de atalho: ALT+S';
    console.log('[educa] ALT+S atribuído ao botão salvar');
  }

  btn.addEventListener('click', function () {
    var editores = document.querySelectorAll('app-diario-escolar-turma-registro-diario .ql-editor');
    console.log('[educa] editores encontrados:', editores.length);

    var nomes = ['observacoes', 'atividades', 'conteudos', 'horario'];
    var registrodiario = {};

    editores.forEach(function (editor, i) {
      var nome = nomes[i] || ('campo_' + i);
      registrodiario[nome] = editor.innerHTML;
      console.log('[educa] capturando', nome, ':', editor.innerHTML.substring(0, 60));

      editor.style.backgroundColor = '#d4edda';
    });

    chrome.storage.sync.set({ registrodiario: registrodiario }, function () {
      console.log('[educa] salvo em storage.registrodiario:', Object.keys(registrodiario));
    });
  });

  document.getElementById('educa-dividir-excluir').addEventListener('click', function () {
    var editores = document.querySelectorAll('app-diario-escolar-turma-registro-diario .ql-editor');
    if (editores.length < 3) {
      console.log('[educa] Dividir: menos de 3 editores encontrados:', editores.length);
      return;
    }

    var texto = editores[0].innerText.trim();
    console.log('[educa] Dividir: texto do primeiro editor:', texto.substring(0, 120));

    var partes = texto.split('.').map(function (s) { return s.replace(/^[ \t]+|[ \t]+$/g, ''); }).filter(function (s) { return s.length > 0; });
    console.log('[educa] Dividir: partes encontradas:', partes.length, partes);

    partes.forEach(function (parte, i) {
      if (i >= editores.length) return;
      var conteudo = parte + '.';
      console.log('[educa] Dividir → editor', i + 1, ':', conteudo);
      editores[i].innerHTML = '<p>' + conteudo + '</p>';
      editores[i].dispatchEvent(new Event('input', { bubbles: true }));
      editores[i].style.backgroundColor = '#fff3cd';
    });
  });

  document.getElementById('educa-limpar-excluir').addEventListener('click', function () {
    chrome.storage.sync.remove('registrodiario', function () {
      console.log('[educa] storage.registrodiario removido');
      var editores = document.querySelectorAll('app-diario-escolar-turma-registro-diario .ql-editor');
      editores.forEach(function (editor) {
        editor.style.backgroundColor = '';
      });
    });
  });

  document.getElementById('educa-colar-excluir').addEventListener('click', function () {
    chrome.storage.sync.get({ registrodiario: null }, function (items) {
      var dados = items.registrodiario;
      if (!dados) {
        console.log('[educa] Colar: nada no storage.registrodiario');
        return;
      }
      console.log('[educa] Colar: colando campos:', Object.keys(dados));

      var editores = document.querySelectorAll('app-diario-escolar-turma-registro-diario .ql-editor');
      var nomes = ['observacoes', 'atividades', 'conteudos', 'horario'];

      editores.forEach(function (editor, i) {
        var nome = nomes[i];
        if (dados[nome] === undefined) return;
        editor.innerHTML = dados[nome];
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('[educa] colado em', nome, ':', dados[nome].substring(0, 60));
        editor.style.backgroundColor = '#fff3cd';
      });
    });
  });
}

var ultimoHash = null;

function tentaInjetar() {
  var hash = window.location.hash;

  if (hash !== ultimoHash) {
    ultimoHash = hash;
    console.log('[educa] rota detectada:', hash, '| página:', paginaAtual());
  }

  if (!paginaAtual()) return;
  if (isPaginaRegistroDiario()) injetaBotaoCopiarExcluir();
}

var observer = new MutationObserver(function () {
  tentaInjetar();
});
observer.observe(document.documentElement, { childList: true, subtree: true });

window.addEventListener('hashchange', function () {
  ultimoHash = null; // força re-detecção na mudança de rota
  tentaInjetar();
});

tentaInjetar();
