// URL_PLANILHA é definida em config.js

let currentStep = 0;
const steps = document.querySelectorAll(".step-content");
const tabs = document.querySelectorAll(".tab-btn");
const form = document.getElementById("laudoForm");

// ====== CACHE DE DADOS (AUTO-SAVE) ======
function saveCache() {
    const data = {};
    document.querySelectorAll('input, textarea, select').forEach(el => {
        if (el.type === 'checkbox') {
            data[el.id] = el.checked;
        } else if (el.id) {
            data[el.id] = el.value;
        }
    });
    localStorage.setItem('laudo_draft_cache', JSON.stringify(data));
}

function loadCache() {
    const saved = localStorage.getItem('laudo_draft_cache');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            document.querySelectorAll('input, textarea, select').forEach(el => {
                if (data[el.id] !== undefined) {
                    if (el.type === 'checkbox') {
                        el.checked = data[el.id];
                    } else {
                        el.value = data[el.id];
                    }
                }
            });
            toggleOutroBeneficio();
            toggleOutroSetor();
            syncSemCPF();
        } catch (e) {
            console.error("Erro ao carregar cache:", e);
        }
    }
}

// Adiciona ouvintes para salvar a cada mudança
form.addEventListener('input', saveCache);
form.addEventListener('change', saveCache);

// Carrega o cache logo ao iniciar
window.onload = loadCache;

// ====== CLIENTE SEM CPF ======
const SEM_CPF = "Não possui CPF";

function toggleSemCPF() {
    const input = document.getElementById('cpf');
    const btn = document.getElementById('btn-sem-cpf');
    const errorEl = document.getElementById('cpf-error');
    const ativo = btn.classList.toggle('active');
    if (ativo) {
        input.value = SEM_CPF;
        input.disabled = true;
        input.classList.remove('invalid');
        errorEl.classList.remove('visible');
    } else {
        input.value = '';
        input.disabled = false;
        input.focus();
    }
    saveCache();
}

// Restaura o estado do botão a partir do valor do campo (usado ao carregar o cache)
function syncSemCPF() {
    const input = document.getElementById('cpf');
    const btn = document.getElementById('btn-sem-cpf');
    const ativo = input.value === SEM_CPF;
    btn.classList.toggle('active', ativo);
    input.disabled = ativo;
}

function toggleOutroBeneficio() {
    const select = document.getElementById('beneficio');
    const container = document.getElementById('outro_beneficio_container');
    const input = document.getElementById('outro_beneficio_texto');
    if (select.value === 'Outros') {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
        input.value = '';
    }
}

function toggleOutroSetor() {
    const select = document.getElementById('setor');
    const container = document.getElementById('outro_setor_container');
    const input = document.getElementById('outro_setor_texto');
    if (select.value === 'Outros') {
        container.style.display = 'block';
        input.setAttribute('required', 'true');
    } else {
        container.style.display = 'none';
        input.removeAttribute('required');
        input.value = '';
    }
}

// Máscaras e Formatações
document.getElementById('cpf').addEventListener('input', function (e) {
    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/);
    e.target.value = !x[2] ? x[1] : x[1] + '.' + x[2] + (x[3] ? '.' + x[3] : '') + (x[4] ? '-' + x[4] : '');
});

document.getElementById('data_inicio').addEventListener('input', function (e) {
    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,2})(\d{0,4})/);
    e.target.value = !x[2] ? x[1] : x[1] + '/' + x[2] + (x[3] ? '/' + x[3] : '');
});

// ====== VALIDADOR DE CPF ======
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    // Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Calcula primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    // Calcula segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;

    return true;
}

// ====== VALIDADOR DE DATA (DD/MM/AAAA) ======
function validarData(dataStr) {
    const partes = dataStr.split('/');
    if (partes.length !== 3) return false;

    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10);
    const ano = parseInt(partes[2], 10);

    if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return false;
    if (ano < 1900 || ano > new Date().getFullYear()) return false;
    if (mes < 1 || mes > 12) return false;
    if (dia < 1 || dia > 31) return false;

    // Verifica dias válidos para o mês (incluindo ano bissexto)
    const dataObj = new Date(ano, mes - 1, dia);
    if (dataObj.getFullYear() !== ano || dataObj.getMonth() !== mes - 1 || dataObj.getDate() !== dia) {
        return false;
    }

    // Não permite datas futuras
    if (dataObj > new Date()) return false;

    return true;
}

// Validação em tempo real (ao sair do campo)
document.getElementById('cpf').addEventListener('blur', function () {
    const errorEl = document.getElementById('cpf-error');
    if (this.value.replace(/\D/g, '').length === 11) {
        if (!validarCPF(this.value)) {
            this.classList.add('invalid');
            errorEl.classList.add('visible');
        } else {
            this.classList.remove('invalid');
            errorEl.classList.remove('visible');
        }
    } else {
        errorEl.classList.remove('visible');
    }
});

document.getElementById('data_inicio').addEventListener('blur', function () {
    const errorEl = document.getElementById('data-error');
    if (this.value.length === 10) {
        if (!validarData(this.value)) {
            this.classList.add('invalid');
            errorEl.classList.add('visible');
        } else {
            this.classList.remove('invalid');
            errorEl.classList.remove('visible');
        }
    } else {
        errorEl.classList.remove('visible');
    }
});

document.getElementById('idade').addEventListener('input', function (e) {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor) {
        e.target.value = valor + " anos";
        let pos = valor.length;
        e.target.setSelectionRange(pos, pos);
    }
});

function getSelectedAvaliacoes() {
    const checks = document.querySelectorAll('input[name="avaliacao"]:checked');
    return Array.from(checks).map(c => c.value).join(", ");
}

function getSelectedCheckboxes(name) {
    const checks = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checks).map(c => c.value).join(", ");
}



// Únicos campos obrigatórios: Setor, Nome Completo, CPF e Idade (passo 0)
function validateRequiredFields() {
    let isValid = true;

    const campos = ['setor', 'nome_paciente', 'cpf', 'idade'];
    // Se o setor for "Outros", o campo de texto também é obrigatório
    if (document.getElementById('setor').value === 'Outros') {
        campos.push('outro_setor_texto');
    }

    campos.forEach(id => {
        const input = document.getElementById(id);
        if (!input.value.trim() || input.value === " anos") {
            input.classList.add("invalid");
            isValid = false;
        } else {
            input.classList.remove("invalid");
        }
    });

    // CPF precisa ser válido, não apenas preenchido (exceto quando "Não possui CPF")
    const cpfInput = document.getElementById('cpf');
    const cpfError = document.getElementById('cpf-error');
    if (cpfInput.value.trim() && cpfInput.value !== SEM_CPF && !validarCPF(cpfInput.value)) {
        cpfInput.classList.add('invalid');
        cpfError.classList.add('visible');
        isValid = false;
    } else {
        cpfError.classList.remove('visible');
    }

    return isValid;
}

function validateAndNext() {
    if (currentStep < steps.length - 1) {
        if (currentStep === 0 && !validateRequiredFields()) {
            alert("Preencha os campos obrigatórios: Setor, Nome Completo, CPF e Idade.");
            return;
        }
        changeStep(1);
    }
}

function showStep(n) {
    if (n > currentStep && currentStep === 0 && !validateRequiredFields()) {
        alert("Preencha os campos obrigatórios: Setor, Nome Completo, CPF e Idade.");
        return;
    }
    steps[currentStep].classList.remove("active");
    tabs[currentStep].classList.remove("active");
    currentStep = n;
    steps[currentStep].classList.add("active");
    tabs[currentStep].classList.add("active");
    document.getElementById("prevBtn").style.display = n === 0 ? "none" : "inline";
    document.getElementById("nextBtn").style.display = n === (steps.length - 1) ? "none" : "inline";
    document.getElementById("nextBtn").innerText = n === (steps.length - 2) ? "Finalizar" : "Avançar";
    if (n === 4) updatePreview();
}

function changeStep(n) {
    let next = currentStep + n;
    if (next >= 0 && next < steps.length) showStep(next);
}

const NAO_SE_APLICA = "Não se aplica";

function updatePreview() {
    const render = document.getElementById("render-area");
    const getVal = (id) => document.getElementById(id).value.trim();
    // Aplica "Não se aplica" após transformações (uppercase/máscara) para preservar a grafia
    const orNA = (v) => v || NAO_SE_APLICA;

    let beneficioFinal = getVal("beneficio");
    if (beneficioFinal === "Outros") {
        beneficioFinal = getVal("outro_beneficio_texto");
    }

    const avaliacoes = orNA(getSelectedAvaliacoes());
    const atividadeExige = orNA(getSelectedCheckboxes('atividade_exige'));
    const baseDII = orNA(getSelectedCheckboxes('base_dii'));

    const camposInc = orNA(getSelectedCheckboxes('campos_incapacidade'));
    const motivosImp = orNA(getSelectedCheckboxes('motivos_impacto'));

    render.innerHTML = `
    <div class="pdf-section">
        <h3>1. Identificação e Contexto Social</h3>
        <p><strong>Nome do Avaliado:</strong> ${orNA(getVal("nome_paciente").toUpperCase())}</p>
        <p><strong>CPF:</strong> ${orNA(getVal("cpf").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'))}</p>
        <p><strong>Benefício a ser Solicitado:</strong> ${orNA(beneficioFinal.toUpperCase())}</p>
        <p><strong>Idade:</strong> ${orNA(getVal("idade"))}</p>
        <p><strong>Escolaridade:</strong> ${orNA(getVal("escolaridade").toUpperCase())}</p>
        <p><strong>Características da comunidade onde reside e acesso ao SUS:</strong> ${orNA(getVal("comunidade").toUpperCase())}</p>
        <p><strong>Profissão habitual/potencial, considerando histórico escolar e contexto social:</strong> ${orNA(getVal("profissao").toUpperCase())}</p>
    </div>
    <hr>
    <div class="pdf-section">
        <h3>2. Avaliação Técnica Médica</h3>
        <p><strong>Atividade exige:</strong> ${atividadeExige}</p>
        <p><strong>O que o laudo relata:</strong> ${avaliacoes}</p>
        <p><strong>Base da DII:</strong> ${baseDII}</p>
        <p><strong>Força muscular:</strong> ${orNA(getVal("forca_muscular"))}</p>
        <p><strong>CIDs:</strong> ${orNA(getVal("cids").toUpperCase())}</p>
        <p><strong>Início da Enfermidade, agravamento ou progressão:</strong> ${orNA(getVal("data_inicio"))}</p>
        <p><strong>Incremento de tratamentos/dosagens:</strong> ${orNA(getVal("tratamentos").toUpperCase())}</p>
    </div>
    <hr>
    <div class="pdf-section">
        <h3>3. Duração e Evolução</h3>
        <p><strong>Campos para Incapacidade:</strong> ${camposInc}</p>
        <p><strong>Grau:</strong> ${orNA(getVal("grau_incapacidade").toUpperCase())}</p>
        <p><strong>Impacto laboral:</strong> ${orNA(getVal("impacto_laboral").toUpperCase())}</p>
        <p><strong>Grau de incapacidade:</strong> ${orNA(getVal("grau_incapacidade_nivel").toUpperCase())}</p>
        <p><strong>Duração da incapacidade:</strong> ${orNA(getVal("duracao_incapacidade").toUpperCase())}</p>
        <p><strong>Motivos do impacto:</strong> ${motivosImp}</p>
    </div>
    <hr>
    <div class="pdf-section">
        <h3>4. Fatores Ambientais e Peculiaridades</h3>
        <p><strong>Possível discriminação/barreiras no trabalho/escola/comunidade/família:</strong> ${orNA(getVal("discriminacao").toUpperCase())}</p>
        <p><strong>Peculiaridades adicionais do caso(avaliadas conforme conduta médica):</strong> ${orNA(getVal("peculiaridades").toUpperCase())}</p>
    </div>
    `;
}

async function generatePDF() {
    if (!validateRequiredFields()) {
        showStep(0);
        alert("Preencha os campos obrigatórios: Setor, Nome Completo, CPF e Idade.");
        return;
    }

    const overlay = document.getElementById('loading-overlay');
    overlay.style.display = 'flex';

    // Coleta de dados em ordem fixa (correspondente às colunas da planilha)
    const getVal = (id) => document.getElementById(id).value.trim();
    // Campos não respondidos são enviados como "Não se aplica"
    const orNA = (v) => v || NAO_SE_APLICA;

    let setorEnvio = getVal("setor");
    if (setorEnvio === "Outros") setorEnvio = getVal("outro_setor_texto");

    let beneficioEnvio = getVal("beneficio");
    if (beneficioEnvio === "Outros") beneficioEnvio = getVal("outro_beneficio_texto");

    const formData = {
        // Seção 1 - Identificação e Contexto Social
        setor: orNA(setorEnvio),
        nome_paciente: orNA(getVal("nome_paciente").toUpperCase()),
        cpf: orNA(getVal("cpf")),
        beneficio: orNA(beneficioEnvio),
        idade: orNA(getVal("idade")),
        escolaridade: orNA(getVal("escolaridade")),
        comunidade: orNA(getVal("comunidade").toUpperCase()),
        profissao: orNA(getVal("profissao").toUpperCase()),
        // Seção 2 - Avaliação Técnica Médica
        atividade_exige: orNA(getSelectedCheckboxes('atividade_exige')),
        tipo_incapacidade: orNA(getSelectedAvaliacoes()),
        base_dii: orNA(getSelectedCheckboxes('base_dii')),
        forca_muscular: orNA(getVal("forca_muscular")),
        cids: orNA(getVal("cids").toUpperCase()),
        data_inicio: orNA(getVal("data_inicio")),
        tratamentos: orNA(getVal("tratamentos").toUpperCase()),
        // Seção 3 - Histórico e Duração
        campos_incapacidade: orNA(getSelectedCheckboxes('campos_incapacidade')),
        grau_incapacidade: orNA(getVal("grau_incapacidade")),
        impacto_laboral: orNA(getVal("impacto_laboral")),
        grau_incapacidade_nivel: orNA(getVal("grau_incapacidade_nivel")),
        duracao_incapacidade: orNA(getVal("duracao_incapacidade")),
        motivos_impacto: orNA(getSelectedCheckboxes('motivos_impacto')),
        // Seção 4 - Fatores Ambientais e Peculiaridades
        discriminacao: orNA(getVal("discriminacao").toUpperCase()),
        peculiaridades: orNA(getVal("peculiaridades").toUpperCase())
    };

    // Inicia animação de passos
    const stepsEl = document.querySelectorAll('.loading-steps li');
    const spinnerEl = document.getElementById('loading-spinner');
    const titleEl = document.getElementById('loading-title');
    const successIcon = document.getElementById('success-icon');
    const successMsg = document.getElementById('success-msg');

    // Reset estado
    stepsEl.forEach(s => { s.classList.remove('active', 'done'); });
    spinnerEl.style.display = 'block';
    titleEl.style.display = 'block';
    successIcon.style.display = 'none';
    successMsg.style.display = 'none';
    document.getElementById('loading-steps').style.display = 'block';

    // Passo 1: Salvando na nuvem
    stepsEl[0].classList.add('active');

    try {
        await fetch(URL_PLANILHA, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(formData)
        });
    } catch (error) {
        console.error("Erro na nuvem:", error);
    }

    stepsEl[0].classList.remove('active');
    stepsEl[0].classList.add('done');

    // Passo 2: Gerando PDF
    stepsEl[1].classList.add('active');

    const element = document.getElementById('pdf-content');
    const opt = {
        margin: 10,
        filename: `Laudo_${document.getElementById('nome_paciente').value}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        // Respeita as regras CSS de quebra de página (evita cortar seções ao meio)
        pagebreak: { mode: ['css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        stepsEl[1].classList.remove('active');
        stepsEl[1].classList.add('done');

        // Passo 3: Finalizando
        stepsEl[2].classList.add('active');

        setTimeout(() => {
            stepsEl[2].classList.remove('active');
            stepsEl[2].classList.add('done');

            // Mostra animação de sucesso
            spinnerEl.style.display = 'none';
            titleEl.style.display = 'none';
            document.getElementById('loading-steps').style.display = 'none';
            successIcon.style.display = 'block';
            successMsg.style.display = 'block';

            // Fecha após 2 segundos e limpa o formulário para um novo preenchimento
            setTimeout(() => {
                overlay.style.display = 'none';
                resetFormData();
                showStep(0);
            }, 2000);
        }, 800);
    });
}

function resetFormData() {
    form.reset();
    document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
    localStorage.removeItem('laudo_draft_cache');
    localStorage.removeItem('laudo_vh_v7');
    toggleOutroBeneficio();
    toggleOutroSetor();
    syncSemCPF();
    updatePreview();
}

function clearForm() {
    if (confirm("Deseja apagar todos os dados?")) {
        resetFormData();
    }
}

// ====== PREENCHER COM IA ======

const AI_PROMPT = `Você é um assistente de triagem de documentação médica para perícia. Vou anexar documentos do paciente. Leia TUDO e extraia APENAS o que está EXPLÍCITO para preencher o formulário.

REGRAS ABSOLUTAS — leia antes de responder:

1. Só registre o que estiver EXPLÍCITO nos documentos. É proibido inferir, deduzir, estimar ou completar com conhecimento médico.
2. Se a informação não estiver nos documentos, DEIXE O CAMPO DE FORA (não escreva "não informado", não invente).
3. Nunca preencha achados de exame físico, limitação funcional ou intensidade de dor que não estejam descritos por escrito.
4. Sempre que copiar um achado relevante, cite a origem: (RM 12/11/2023), (atestado Dr. Silva 03/2024), (CAT 15/07/2023).
5. Datas no formato brasileiro dd/mm/aaaa (ex: 15/07/2023).
6. Nos campos de lista, use EXATAMENTE uma das opções permitidas, copiada letra por letra. Se nenhuma servir, omita.
7. Se documentos forem ilegíveis ou de outro paciente, diga e não invente nada.

O FORMULÁRIO RECEBE ESTES DADOS:

SEÇÃO 1 - Identificação e Contexto Social:
- nome: nome completo
- idade: número em anos
- profissao: profissão habitual
- comunidade: acesso à saúde, características do local

SEÇÃO 2 - Avaliação Técnica Médica:
- cid: CID-10 (ex: M54.5)
- inicioSintomas: dd/mm/aaaa quando começou
- queixa: queixa principal conforme documentos
- forca_muscular: 0-5 conforme escrito
- medicamentos: nome, dose, tempo
- rx / usg / tc / rm: data + achados
- fisioterapia: número de sessões e período
- cirurgia: data e procedimento

SEÇÃO 3 - Capacidade Funcional:
- repercussao: como a doença impacta — use EXATAMENTE: "Esforço físico" | "Marcha prolongada" | "Permanecer sentado" | "Permanecer em pé" | "Movimentos repetitivos" | "Carregar peso" | "Trabalhar"
- cap_caminhar: "Normal" | "Leve" | "Moderada" | "Grave" | "Incapaz" (APENAS se escrito)
- cap_permanecer_sentado: idem
- cap_permanecer_em_pe: idem
- cap_subir_escadas: idem
- cap_agachar: idem
- cap_levantar_peso: idem
- cap_trabalhar: idem (essencial para o laudo)
- cap_dormir_adequadamente: idem

SEÇÃO 4 - Evolução e Impacto:
- evolucao: tempo desde o início (ex: "13 meses")
- afastamento: "Sim" | "Não"
- afastamentoTipo: "Determinado" | "Indeterminado" (APENAS se afastamento=Sim)
- afastamentoDias: número de dias (se houver)

SEÇÃO 5 - Contexto Adicional:
- descricaoTrauma: como/quando ocorreu
- comorbidades: doenças, cirurgias, medicações anteriores
- exameFisicoObs: achados de exame físico com fonte
- inspecao: ["Inchaço/edema" | "Deformidade" | "Atrofia muscular" | "Cicatrizes" | "Sem alterações à inspeção"]
- conclusao: síntese do quadro, sem juízo pericial

FORMATO DA RESPOSTA — um único bloco JSON, sem texto antes ou depois:

{
  "nome": "texto",
  "idade": "número",
  "profissao": "texto",
  "comunidade": "texto",

  "cid": "CID-10",
  "inicioSintomas": "dd/mm/aaaa",
  "queixa": "queixa conforme documentos",
  "forca_muscular": 0-5,
  "medicamentos": "descrição",
  "rx": "data + achados",
  "usg": "data + achados",
  "tc": "data + achados",
  "rm": "data + achados",
  "fisioterapia": "sessões e período",
  "cirurgia": "data e procedimento",

  "repercussao": ["item1", "item2"],
  "cap_caminhar": "opção",
  "cap_permanecer_sentado": "opção",
  "cap_permanecer_em_pe": "opção",
  "cap_subir_escadas": "opção",
  "cap_agachar": "opção",
  "cap_levantar_peso": "opção",
  "cap_trabalhar": "opção",
  "cap_dormir_adequadamente": "opção",

  "evolucao": "tempo",
  "afastamento": "Sim | Não",
  "afastamentoTipo": "Determinado | Indeterminado",
  "afastamentoDias": "número",

  "descricaoTrauma": "detalhes",
  "comorbidades": "doenças, medicações",
  "exameFisicoObs": "achados com fonte",
  "inspecao": ["opção1", "opção2"],
  "conclusao": "síntese objetiva",

  "pendencias": ["lista do que falta coletar na consulta/exame"]
}

INSTRUÇÕES FINAIS:
- Omita completamente campos sem informação nos documentos (JSON curto > JSON inventado).
- Em arrays (repercussao, inspecao): inclua APENAS itens confirmados. Se nenhum, omita a chave.
- Capacidade funcional (cap_*): APENAS se o documento descrever textualmente. Na dúvida, omita e liste em "pendencias".
- "pendencias" é OBRIGATÓRIO: especifique o que falta (ex: "Teste de força detalhado do ombro D", "Escala EVA de dor", "Grau de limitação para agachar").
- Responda APENAS com JSON. Sem introdução, sem comentários, sem explicações depois.`;

// ---- Modal controls ----

// Insere o prompt uma vez na página (não a cada clique)
window.addEventListener('DOMContentLoaded', function() {
    const promptElement = document.getElementById('ai-prompt-text');
    if (promptElement && !promptElement.textContent) {
        promptElement.textContent = AI_PROMPT;
    }
});

function openAIModal() {
    const overlay = document.getElementById('ai-modal-overlay');
    overlay.classList.add('open');
    document.getElementById('ai-response-input').value = '';
    document.getElementById('ai-error-msg').classList.remove('visible');
    document.getElementById('ai-prompt-view').classList.remove('open');
}

function closeAIModal() {
    document.getElementById('ai-modal-overlay').classList.remove('open');
}

function handleOverlayClick(e) {
    if (e.target === document.getElementById('ai-modal-overlay')) {
        closeAIModal();
    }
}

async function copyAIPrompt() {
    const btn = document.querySelector('.btn-ai-copy');
    try {
        await navigator.clipboard.writeText(AI_PROMPT);
        btn.textContent = '✅ Copiado!';
    } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = AI_PROMPT;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.textContent = '✅ Copiado!';
    }
    setTimeout(() => { btn.textContent = '📋 Copiar prompt'; }, 2500);
}

function togglePromptView() {
    const view = document.getElementById('ai-prompt-view');
    const btn = document.querySelector('.btn-ai-view');
    const isOpen = view.classList.toggle('open');
    btn.textContent = isOpen ? 'Ocultar prompt' : 'Ver prompt';
}

// ---- Aplicar resposta da IA ----

function applyAIResponse() {
    const input = document.getElementById('ai-response-input').value.trim();
    const errorEl = document.getElementById('ai-error-msg');

    if (!input) {
        errorEl.textContent = 'Cole a resposta da IA antes de preencher.';
        errorEl.classList.add('visible');
        return;
    }

    try {
        // Extrai JSON mesmo que a IA tenha adicionado texto ao redor
        let jsonStr = input;
        const jsonMatch = input.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonStr = jsonMatch[0];

        const data = JSON.parse(jsonStr);
        const count = mapAIDataToForm(data);

        // Dispara toggles condicionais e salva cache
        toggleOutroBeneficio();
        toggleOutroSetor();
        syncSemCPF();
        saveCache();

        closeAIModal();
        showStep(0);

        // Toast de sucesso
        showToast(`✅ ${count} campos preenchidos com sucesso!`);

    } catch (e) {
        errorEl.textContent = 'JSON inválido. Verifique se a resposta da IA está no formato correto.';
        errorEl.classList.add('visible');
        console.error('Erro ao parsear resposta da IA:', e);
    }
}

function showToast(msg) {
    const toast = document.getElementById('ai-toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3500);
}

// ---- Mapeamento: JSON da IA → campos do formulário ----

function mapAIDataToForm(data) {
    let filled = 0;

    // Helpers
    const setVal = (id, val) => {
        if (!val) return false;
        const el = document.getElementById(id);
        if (!el) return false;
        el.value = String(val);
        return true;
    };

    const setSelect = (id, val) => {
        if (!val) return false;
        const sel = document.getElementById(id);
        if (!sel) return false;
        for (const opt of sel.options) {
            if (opt.value === val) { sel.value = val; return true; }
        }
        return false;
    };

    const setCheckboxes = (name, values) => {
        if (!values || !Array.isArray(values) || !values.length) return 0;
        let count = 0;
        document.querySelectorAll(`input[name="${name}"]`).forEach(cb => {
            if (values.includes(cb.value)) { cb.checked = true; count++; }
        });
        return count;
    };

    // ==== Seção 1: Identificação e Contexto Social ====

    if (setVal('nome_paciente', data.nome)) filled++;

    if (data.idade) {
        const num = String(data.idade).replace(/\D/g, '');
        if (num && setVal('idade', num + ' anos')) filled++;
    }

    if (setVal('profissao', data.profissao || data.funcao)) filled++;

    // ==== Seção 2: Avaliação Técnica Médica ====

    // Atividade exige — inferir a partir de repercussao
    if (data.repercussao && Array.isArray(data.repercussao)) {
        const ativ = [];
        if (data.repercussao.some(r => ['Esforço físico', 'Carregar peso'].includes(r))) ativ.push('Esforço físico');
        if (data.repercussao.includes('Movimentos repetitivos')) ativ.push('Movimentos repetitivos');
        if (data.repercussao.some(r => ['Permanecer sentado', 'Permanecer em pé'].includes(r))) ativ.push('Atenção/concentração');
        filled += setCheckboxes('atividade_exige', ativ);
    }

    // O que o laudo relata — inferir da documentação
    const avaliacoes = [];
    const CAP_FIELDS = ['cap_caminhar', 'cap_permanecer_sentado', 'cap_permanecer_em_pe',
        'cap_subir_escadas', 'cap_agachar', 'cap_levantar_peso', 'cap_trabalhar', 'cap_dormir_adequadamente'];
    const hasLimitation = CAP_FIELDS.some(f => data[f] && data[f] !== 'Normal');

    if (data.cid) avaliacoes.push('Atestar presença da doença');
    if (hasLimitation) avaliacoes.push('Redução da capacidade');
    if (data.cap_trabalhar && ['Grave', 'Incapaz'].includes(data.cap_trabalhar)) avaliacoes.push('Incapacidade');
    if (data.afastamentoTipo === 'Indeterminado') avaliacoes.push('Impedimento a longo prazo');
    filled += setCheckboxes('avaliacao', avaliacoes);

    // Base da DII
    const baseDii = [];
    if (data.queixa || data.exameFisicoObs) baseDii.push('Clínica');
    if (data.rx || data.usg || data.tc || data.rm || data.examesOutros) baseDii.push('Exame');
    if (data.afastamento === 'Sim') baseDii.push('Afastamento');
    if (data.evolucao) baseDii.push('Evolução');
    filled += setCheckboxes('base_dii', baseDii);

    // CIDs
    if (setVal('cids', data.cid)) filled++;

    // Data início
    if (setVal('data_inicio', data.inicioSintomas)) filled++;

    // Tratamentos — agregar todas as informações de tratamento
    const trat = [];
    if (data.medicamentos) trat.push('Medicamentos: ' + data.medicamentos);
    if (data.fisioterapia) trat.push('Fisioterapia: ' + data.fisioterapia);
    if (data.infiltracao) trat.push('Infiltração: ' + data.infiltracao);
    if (data.cirurgia) trat.push('Cirurgia: ' + data.cirurgia);
    if (data.tratamentoOutros) trat.push(data.tratamentoOutros);
    if (trat.length && setVal('tratamentos', trat.join('\n'))) filled++;

    // ==== Seção 3: Duração e Evolução ====

    // Campos de incapacidade
    const camposInc = [];
    if (data.capacidadeObs || hasLimitation) camposInc.push('Limitações funcionais');
    if (data.eva && data.eva >= 7) camposInc.push('Dor incapacitante');
    if (data.inspecao && Array.isArray(data.inspecao) && data.inspecao.includes('Atrofia muscular')) camposInc.push('Redução de força');

    const mobFields = ['cap_caminhar', 'cap_subir_escadas', 'cap_agachar'];
    if (mobFields.some(f => data[f] && ['Moderada', 'Grave', 'Incapaz'].includes(data[f]))) camposInc.push('Limitação de mobilidade');
    if (data.cap_levantar_peso && ['Moderada', 'Grave', 'Incapaz'].includes(data.cap_levantar_peso)) camposInc.push('Sustentação de carga prejudicada');
    if (data.repercussao && Array.isArray(data.repercussao) && data.repercussao.includes('Movimentos repetitivos')) camposInc.push('Movimentos repetitivos prejudicados');
    filled += setCheckboxes('campos_incapacidade', camposInc);

    // Grau
    if (data.cap_trabalhar) {
        const grauMap = { 'Incapaz': 'Grave', 'Grave': 'Grave', 'Moderada': 'Moderado', 'Leve': 'Leve' };
        if (grauMap[data.cap_trabalhar] && setSelect('grau_incapacidade', grauMap[data.cap_trabalhar])) filled++;
    }

    // Impacto laboral
    if (data.cap_trabalhar) {
        let impacto = '';
        if (data.cap_trabalhar === 'Incapaz') impacto = 'Impede totalmente';
        else if (['Grave', 'Moderada'].includes(data.cap_trabalhar)) impacto = 'Impede parcialmente';
        else if (['Normal', 'Leve'].includes(data.cap_trabalhar)) impacto = 'Não impede';
        if (impacto && setSelect('impacto_laboral', impacto)) filled++;
    }

    // Grau de incapacidade (parcial/total)
    if (data.cap_trabalhar === 'Incapaz') {
        if (setSelect('grau_incapacidade_nivel', 'Total')) filled++;
    } else if (hasLimitation) {
        if (setSelect('grau_incapacidade_nivel', 'Parcial')) filled++;
    }

    // Duração
    if (data.afastamentoTipo === 'Indeterminado') {
        if (setSelect('duracao_incapacidade', 'Permanente')) filled++;
    } else if (data.afastamentoTipo === 'Determinado') {
        if (setSelect('duracao_incapacidade', 'Temporária')) filled++;
    }

    // Motivos do impacto
    if (data.repercussao && Array.isArray(data.repercussao)) {
        const motivos = [];
        if (data.repercussao.some(r => ['Esforço físico', 'Carregar peso'].includes(r))) motivos.push('Esforço físico incompatível');
        if (data.repercussao.includes('Movimentos repetitivos')) motivos.push('Repetição inviável');
        if (data.repercussao.includes('Trabalhar')) motivos.push('Risco à saúde');
        filled += setCheckboxes('motivos_impacto', motivos);
    }

    // ==== Seção 4: Fatores Ambientais e Peculiaridades ====

    // Peculiaridades — agregar todas as informações extras da IA
    const pecul = [];

    if (data.queixa) pecul.push('Queixa principal: ' + data.queixa);
    if (data.segmento && Array.isArray(data.segmento)) pecul.push('Segmento(s) afetado(s): ' + data.segmento.join(', '));
    if (data.comorbidades) pecul.push('Comorbidades: ' + data.comorbidades);
    if (data.descricaoTrauma) pecul.push('Descrição do trauma: ' + data.descricaoTrauma);
    if (data.evolucao) pecul.push('Evolução: ' + data.evolucao);

    // Exames
    const exames = [];
    if (data.rx) exames.push('RX: ' + data.rx);
    if (data.usg) exames.push('USG: ' + data.usg);
    if (data.tc) exames.push('TC: ' + data.tc);
    if (data.rm) exames.push('RM: ' + data.rm);
    if (data.examesOutros) exames.push('Outros: ' + data.examesOutros);
    if (exames.length) pecul.push('Exames:\n' + exames.join('\n'));

    if (data.exameFisicoObs) pecul.push('Exame físico documentado: ' + data.exameFisicoObs);
    if (data.capacidadeObs) pecul.push('Capacidade funcional: ' + data.capacidadeObs);
    if (data.repercussaoObs) pecul.push('Repercussão laboral: ' + data.repercussaoObs);

    // Dispositivos
    if (data.dispositivo && Array.isArray(data.dispositivo) && !data.dispositivo.includes('Nenhum')) {
        let disp = 'Dispositivos: ' + data.dispositivo.join(', ');
        if (data.dispositivoObs) disp += ' — ' + data.dispositivoObs;
        pecul.push(disp);
    }

    // Afastamento
    if (data.afastamento === 'Sim') {
        let afast = 'Afastamento: Sim';
        if (data.afastamentoTipo) afast += ' (' + data.afastamentoTipo + ')';
        if (data.afastamentoDias) afast += ' — ' + data.afastamentoDias + ' dias';
        pecul.push(afast);
    }

    if (data.conclusao) pecul.push('Conclusão documental: ' + data.conclusao);

    // Pendências
    if (data.pendencias && Array.isArray(data.pendencias) && data.pendencias.length) {
        pecul.push('⚠ Pendências (colher em consulta):\n• ' + data.pendencias.join('\n• '));
    }

    if (pecul.length && setVal('peculiaridades', pecul.join('\n\n'))) filled++;

    return filled;
}
