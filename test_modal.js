// Script de teste: verifica se o modal abre rápido e o prompt está disponível
// Abra o console (F12) e cole este código

(async function testAIModal() {
    console.log('🧪 Iniciando teste do modal de IA...\n');

    // Teste 1: Verificar se o prompt está carregado
    const promptElement = document.getElementById('ai-prompt-text');
    if (promptElement && promptElement.textContent.length > 100) {
        console.log('✅ Teste 1: Prompt carregado na página');
        console.log(`   Tamanho do prompt: ${promptElement.textContent.length} caracteres\n`);
    } else {
        console.log('❌ Teste 1: Prompt NÃO carregado\n');
    }

    // Teste 2: Medir tempo de abertura do modal
    console.log('⏱️  Teste 2: Abrindo modal (medindo tempo)...');
    const startTime = performance.now();
    openAIModal();
    const endTime = performance.now();
    const openTime = (endTime - startTime).toFixed(2);

    console.log(`✅ Modal aberto em ${openTime}ms`);
    if (openTime < 100) {
        console.log('   ⚡ Muito rápido!\n');
    } else if (openTime < 300) {
        console.log('   ✓ Rápido\n');
    } else {
        console.log('   ⚠️  Poderia ser mais rápido\n');
    }

    // Teste 3: Verificar se o prompt está visível
    const overlay = document.getElementById('ai-modal-overlay');
    const isVisible = overlay.classList.contains('open');
    console.log(`✅ Teste 3: Modal visível? ${isVisible ? 'SIM ✓' : 'NÃO ❌'}\n`);

    // Teste 4: Testar cópia do prompt
    console.log('📋 Teste 4: Copiando prompt para clipboard...');
    try {
        await navigator.clipboard.writeText(AI_PROMPT);
        console.log('✅ Prompt copiado com sucesso!\n');
    } catch (e) {
        console.log('⚠️  Clipboard API indisponível (segurança)\n');
    }

    // Teste 5: Simular preenchimento com JSON de exemplo
    console.log('📝 Teste 5: Simulando preenchimento com JSON de exemplo...');
    const exampleJSON = {
        "nome": "João da Silva",
        "idade": "45",
        "profissao": "Pedreiro",
        "cid": "M54.5",
        "inicioSintomas": "15/07/2023",
        "queixa": "Dor em coluna lombar",
        "cap_trabalhar": "Grave",
        "evolucao": "8 meses",
        "afastamento": "Sim",
        "pendencias": ["Exame de força muscular", "Avaliar amplitude de movimento"]
    };

    document.getElementById('ai-response-input').value = JSON.stringify(exampleJSON);
    console.log('✅ JSON de exemplo inserido no textarea\n');

    console.log('═══════════════════════════════════════');
    console.log('🎉 Todos os testes concluídos!');
    console.log('═══════════════════════════════════════\n');
    console.log('Próximos passos:');
    console.log('1. Clique no botão "Preencher formulário" para testar o mapeamento');
    console.log('2. Verifique se os campos do formulário foram preenchidos corretamente');
    console.log('3. Navegue pelas seções e confirme os dados\n');
})();
