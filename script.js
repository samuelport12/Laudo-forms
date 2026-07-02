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
