# Melhorias de UX Mobile - Sistema de Torrefação de Café

## 1. Visão Geral
Este documento define melhorias específicas para otimizar a experiência mobile do sistema de torrefação de café, focando em transições suaves, espaçamento consistente e alvos de toque apropriados para dispositivos móveis.

## 2. Princípios de Design Mobile

### 2.1 Transições e Animações
- **Transições de página**: Fade-in de 200ms ao navegar entre páginas
- **Cards de café**: Slide-up de 150ms ao carregar lista
- **Modais**: Scale-up de 250ms com backdrop fade
- **Botões**: Efeito ripple de 100ms no toque
- **Formulários**: Animação suave de 200ms para campos com foco

### 2.2 Espaçamento e Layout
- **Margens laterais**: 16px em telas menores que 375px, 20px em telas maiores
- **Espaçamento entre cards**: 12px vertical, 16px horizontal
- **Padding interno dos cards**: 16px
- **Altura mínima de toque**: 44px para todos os elementos interativos
- **Espaçamento entre botões**: 8px mínimo

### 2.3 Alvos de Toque
- **Botões principais**: Altura mínima 48px, largura mínima 120px
- **Ícones de ação**: Área de toque de 44x44px (incluindo padding)
- **Campos de formulário**: Altura 48px com labels flutuantes
- **Checkboxes e radios**: Tamanho 24px com área de toque total 44px
- **Links de navegação**: Altura 44px mínimo

## 3. Melhorias por Componente

### 3.1 Navegação (Navigation.tsx)
- Transformar em bottom navigation fixo em mobile
- Ícones com labels apenas quando houver espaço (>375px)
- Indicador de página ativa com animação de slide
- Altura do componente: 56px

### 3.2 Lista de Cafés (CoffeeList.tsx)
- **Cards otimizados**: 
  - Altura fixa de 120px
  - Swipe horizontal para ações rápidas (editar/excluir)
  - Imagem de 60x60px com border-radius de 8px
  - Sombra suave (shadow-sm) com elevação no toque
- **Scroll infinito**: Carregar mais itens ao chegar ao final
- **Pull-to-refresh**: Atualizar lista ao puxar para baixo

### 3.3 Formulários (CoffeeForm.tsx, MovementForm.tsx)
- **Campos otimizados**:
  - Labels flutuantes para economizar espaço
  - Teclado numérico para campos de peso e valor
  - Selects nativos do sistema mobile
  - Validação em tempo real com feedback visual
- **Botão de submit**: Fixo na parte inferior com altura 56px
- **Progress indicator**: Barra de progresso para formulários longos

### 3.4 Dashboard (Dashboard.tsx)
- **Cards de métricas**: Layout de grade 2x2 em mobile
- **Gráficos**: Simplificar para versões miniatura
- **Scroll horizontal**: Para cards que não cabem na tela
- **Touch gestures**: Pinch-to-zoom em gráficos quando aplicável

### 3.5 Modais (Modal.tsx)
- **Posicionamento**: Bottom sheet em mobile (deslizar de baixo)
- **Altura máxima**: 90% da tela
- **Fechar**: Swipe down ou botão X no canto superior
- **Backdrop**: Toque fora para fechar

## 4. Otimizações de Performance

### 4.1 Prevenção de Layout Shift
- **Dimensões fixas**: Definir width/height para imagens
- **Skeleton screens**: Mostrar durante carregamento
- **Container queries**: Usar para componentes responsivos
- **Font loading**: Usar font-display: swap

### 4.2 Gestos e Interações
- **Touch feedback**: Visual imediato (opacity change)
- **Debouncing**: Em buscas e filtros (300ms)
- **Momentum scrolling**: Habilitar -webkit-overflow-scrolling
- **Passive listeners**: Usar para scroll e touch events

### 4.3 Estados de Carregamento
- **Spinners nativos**: Usar componentes visuais leves
- **Progressive loading**: Carregar conteúdo visível primeiro
- **Offline states**: Mostrar mensagens apropriadas
- **Error boundaries**: Tratar erros gracefully

## 5. Adaptações por Tamanho de Tela

### 5.1 Pequenas telas (< 375px)
- Fontes mínimas de 14px
- Botões com texto completo apenas quando necessário
- Ícones maiores (24px) para melhor visibilidade
- Espaçamento reduzido entre elementos

### 5.2 Médias telas (375px - 768px)
- Fontes de 16px para melhor legibilidade
- Layout de coluna única com exceções para cards
- Aproveitar espaço lateral para ações contextuais

### 5.3 Tablets (≥ 768px)
- Layout de duas colunas para listas
- Sidebar colapsável se aplicável
- Manter proporções desktop quando caberem

## 6. Testes e Validação

### 6.1 Dispositivos de Teste
- iPhone SE (320px) - menor tela moderna
- iPhone 12/13 (390px) - tela média popular
- Android médio (360px) - mercado em desenvolvimento
- Tablet iPad (768px) - caso de uso tablet

### 6.2 Ferramentas de Debug
- Chrome DevTools Device Mode
- Lighthouse Mobile Score (target: 90+)
- WebPageTest para tempos de carregamento real
- Touch event testing em dispositivos reais

### 6.3 Métricas de Sucesso
- **First Contentful Paint**: < 1.5s em 3G
- **Largest Contentful Paint**: < 2.5s em 3G
- **Time to Interactive**: < 3.5s em 3G
- **Layout Shift**: < 0.1 (CLS)
- **Touch target size**: 100% dos elementos ≥ 44px