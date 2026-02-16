# -*- coding: utf-8 -*-
import codecs

# Ler arquivo com encoding UTF-8
with codecs.open(r'c:\Users\Dan\Downloads\coffee-roaster-main\coffee-roaster-main\src\components\MovementForm.tsx', 'r', 'utf-8') as f:
    content = f.read()

# Texto antigo a ser substituído
old_text = """              {/* Botão + Adicionar PR - desabilitar se todos PRs disponíveis foram selecionados */}
              {(() => {
                const availablePRsCount = movementType === 'saida' && entry.coffeeId
                  ? getAvailablePRsForCoffee(entry.coffeeId, entry.id, 'check').length
                  : Infinity;
                
                const canAddMorePRs = availablePRsCount > 0;"""

# Novo texto
new_text = """              {/* Botão + Adicionar PR - habilitar apenas se último PR estiver preenchido */}
              {(() => {
                // Pegar última linha de PR
                const lastPrLine = entry.prLines[entry.prLines.length - 1];
                
                // Para ENTRADA: verificar se tem 4+ dígitos digitados
                // Para SAÍDA: verificar se selecionou um PR da lista
                const canAddMorePRs = lastPrLine && lastPrLine.pr && lastPrLine.pr.length >= 4;"""

# Fazer substituição
if old_text in content:
    content = content.replace(old_text, new_text)
    
    # Salvar arquivo com encoding UTF-8
    with codecs.open(r'c:\Users\Dan\Downloads\coffee-roaster-main\coffee-roaster-main\src\components\MovementForm.tsx', 'w', 'utf-8') as f:
        f.write(content)
    
    print("✅ Correção aplicada com sucesso!")
else:
    print("❌ ERRO: Texto original não encontrado")
    print("\nPrimeiras 500 caracteres do conteúdo próximo à linha 608:")
    # Encontrar posição aproximada
    lines = content.split('\n')
    if len(lines) > 608:
        print('\n'.join(lines[605:615]))
