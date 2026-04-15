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

function toggleOutroBeneficio() {
    const select = document.getElementById('beneficio');
    const container = document.getElementById('outro_beneficio_container');
    const input = document.getElementById('outro_beneficio_texto');
    if (select.value === 'Outros') {
        container.style.display = 'block';
        input.setAttribute('required', 'true');
    } else {
        container.style.display = 'none';
        input.removeAttribute('required');
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

function validateStep(stepIndex) {
    const currentStepEl = steps[stepIndex];
    const inputs = currentStepEl.querySelectorAll("input[required], textarea[required], select[required]");
    let isValid = true;

    inputs.forEach(input => {
        if (input.offsetParent !== null) {
            if (!input.value.trim() || input.value === " anos") {
                input.classList.add("invalid");
                isValid = false;
            } else {
                input.classList.remove("invalid");
            }
        }
    });

    // Validação de CPF no passo 0
    if (stepIndex === 0) {
        const cpfInput = document.getElementById('cpf');
        const cpfError = document.getElementById('cpf-error');
        if (cpfInput.value.trim() && !validarCPF(cpfInput.value)) {
            cpfInput.classList.add('invalid');
            cpfError.classList.add('visible');
            isValid = false;
        } else {
            cpfError.classList.remove('visible');
        }
    }

    // Validação específica para o checkbox e data no passo 1 (índice 1)
    if (stepIndex === 1) {
        const group = document.getElementById('tipo_incapacidade_group');
        if (getSelectedAvaliacoes() === "") {
            group.classList.add("invalid");
            isValid = false;
        } else {
            group.classList.remove("invalid");
        }

        // Validação da data de início da enfermidade
        const dataInput = document.getElementById('data_inicio');
        const dataError = document.getElementById('data-error');
        if (dataInput.value.trim() && !validarData(dataInput.value)) {
            dataInput.classList.add('invalid');
            dataError.classList.add('visible');
            isValid = false;
        } else {
            dataError.classList.remove('visible');
        }
    }

    return isValid;
}

function validateAndNext() {
    if (currentStep < steps.length - 1) {
        if (validateStep(currentStep)) {
            changeStep(1);
        } else {
            alert("Por favor, preencha todos os campos obrigatórios marcados em vermelho.");
        }
    }
}

function showStep(n) {
    if (n > currentStep && !validateStep(currentStep)) {
        alert("Preencha os campos obrigatórios primeiro.");
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

function updatePreview() {
    const render = document.getElementById("render-area");
    const getVal = (id) => document.getElementById(id).value || "---";

    let beneficioFinal = getVal("beneficio");
    if (beneficioFinal === "Outros") {
        beneficioFinal = getVal("outro_beneficio_texto");
    }

    const avaliacoes = getSelectedAvaliacoes() || "---";

    render.innerHTML = `
    <div class="pdf-section">
        <p><strong>Nome do Avaliado:</strong> ${getVal("nome_paciente").toUpperCase()}</p>
        <p><strong>CPF:</strong> ${getVal("cpf").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
        <p><strong>Benefício a ser Solicitado:</strong> ${beneficioFinal.toUpperCase()}</p>
        <p><strong>Idade:</strong> ${getVal("idade")}</p>
        <p><strong>Escolaridade:</strong> ${getVal("escolaridade").toUpperCase()}</p>
        <p><strong>Características da comunidade onde reside e acesso ao SUS:</strong> ${getVal("comunidade").toUpperCase()}</p>
        <p><strong>Profissão habitual/potencial, considerando histórico escolar e contexto social:</strong> ${getVal("profissao").toUpperCase()}</p>
    </div>
    <hr>
    <div class="pdf-section">
        <p><strong>Avaliação médica Solicitada:</strong> ${avaliacoes}</p>
        <p><strong>Início da Enfermidade, agravamento ou progressão:</strong> ${getVal("data_inicio")}</p>
        <p><strong>Incremento de tratamentos/dosagens:</strong> ${getVal("tratamentos").toUpperCase()}</p>
        <p><strong>Duração Estimada do impedimento/incapacidade/redução da capacidade laborativa:</strong> ${getVal("duracao").toUpperCase()}</p>
    </div>
    <hr>
    <div class="pdf-section">
        <p><strong>Possível discriminação/barreiras no trabalho/escola/comunidade/família:</strong> ${getVal("discriminacao").toUpperCase()}</p>
        <p><strong>Peculiaridades adicionais do caso(avaliadas conforme conduta médica):</strong> ${getVal("peculiaridades").toUpperCase()}</p>
    </div>
    `;
}

async function generatePDF() {
    if (!validateStep(currentStep)) return;

    const overlay = document.getElementById('loading-overlay');
    overlay.style.display = 'flex';

    // Coleta de dados em ordem fixa (correspondente às colunas da planilha)
    const getVal = (id) => document.getElementById(id).value || "";

    let setorEnvio = getVal("setor");
    if (setorEnvio === "Outros") setorEnvio = getVal("outro_setor_texto");

    let beneficioEnvio = getVal("beneficio");
    if (beneficioEnvio === "Outros") beneficioEnvio = getVal("outro_beneficio_texto");

    const formData = {
        setor: setorEnvio,
        nome_paciente: getVal("nome_paciente").toUpperCase(),
        cpf: getVal("cpf"),
        beneficio: beneficioEnvio,
        idade: getVal("idade"),
        escolaridade: getVal("escolaridade"),
        comunidade: getVal("comunidade").toUpperCase(),
        profissao: getVal("profissao").toUpperCase(),
        tipo_incapacidade: getSelectedAvaliacoes(),
        data_inicio: getVal("data_inicio"),
        tratamentos: getVal("tratamentos").toUpperCase(),
        duracao: getVal("duracao").toUpperCase(),
        discriminacao: getVal("discriminacao").toUpperCase(),
        peculiaridades: getVal("peculiaridades").toUpperCase()
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
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
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

            // Fecha após 2 segundos
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 2000);
        }, 800);
    });
}

function clearForm() {
    if (confirm("Deseja apagar todos os dados?")) {
        form.reset();
        document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
        localStorage.removeItem('laudo_draft_cache');
        localStorage.removeItem('laudo_vh_v7');
        toggleOutroBeneficio();
        updatePreview();
    }
}
