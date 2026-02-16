# -*- coding: utf-8 -*-
import codecs

# Ler arquivo linha por linha
with codecs.open(r'c:\Users\Dan\Downloads\coffee-roaster-main\coffee-roaster-main\src\components\MovementForm.tsx', 'r', 'utf-8-sig') as f:
    lines = f.readlines()

print(f"Total de linhas: {len(lines)}")
print("\nLinhas 608-615:")
for i in range(607, min(615, len(lines))):
    print(f"{i+1}: {repr(lines[i][:80])}")

# Tentar substituir linha por linha
lines_modified = False
for i in range(607, min(615, len(lines))):
    if 'availablePRsCount' in lines[i]:
        print(f"\n✓ Encontrado availablePRsCount na linha {i+1}")
        lines_modified = True
        break

if lines_modified:
    # Substituir as linhas 608-614 (índices 607-613)
    new_lines = [
        "              {/* Botão + Adicionar PR - habilitar apenas se último PR estiver preenchido */}\n",
        "              {(() => {\n",
        "                // Pegar última linha de PR\n",
        "                const lastPrLine = entry.prLines[entry.prLines.length - 1];\n",
        "                \n",
        "                // Para ENTRADA: verificar se tem 4+ dígitos digitados\n",
        "                // Para SAÍDA: verificar se selecionou um PR da lista\n",
        "                const canAddMorePRs = lastPrLine && lastPrLine.pr && lastPrLine.pr.length >= 4;\n",
    ]
    
    # Substituir
    lines[607:614] = new_lines
    
    # Salvar
    with codecs.open(r'c:\Users\Dan\Downloads\coffee-roaster-main\coffee-roaster-main\src\components\MovementForm.tsx', 'w', 'utf-8') as f:
        f.writelines(lines)
    
    print("\n✅ Arquivo atualizado com sucesso!")
else:
    print("\n❌ Linha com availablePRsCount não encontrada")
