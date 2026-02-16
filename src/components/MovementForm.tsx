import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Check, Edit2, Loader2 } from 'lucide-react';
import { Movement } from '../types';
import { supabase } from '../lib/supabase';

interface FormData {
  type: 'entrada' | 'saida';
}

interface PrLine {
  id: string;
  pr: string;
  quantity: string;
}

interface Entry {
  id: string;
  coffeeId: string;
  date: string; // Apenas para entradas
  prLines: PrLine[];
  observations: string; // Observações por entrada
}

interface MovementFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onRequestClose?: () => void; // Nova prop para interceptar fechamento do modal
  initialData?: Movement;
}

const MovementForm: React.FC<MovementFormProps> = ({ onSuccess, onCancel, onRequestClose, initialData }) => {
  const { state, actions } = useApp();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Estado de entradas com PRs aninhados
  const [entries, setEntries] = useState<Entry[]>([
    {
      id: crypto.randomUUID(),
      coffeeId: '',
      date: new Date().toISOString().split('T')[0],
      prLines: [{ id: crypto.randomUUID(), pr: '', quantity: '' }],
      observations: ''
    }
  ]);

  const [showSummary, setShowSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Estado para validação de PRs em tempo real
  const [prErrors, setPrErrors] = useState<Record<string, string>>({});
  const [validatingPrs, setValidatingPrs] = useState<Record<string, boolean>>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<FormData>({
    defaultValues: {
      type: initialData?.type ?? 'entrada',
    },
  });


  const movementType = watch('type');

  // Limpar dados pendentes ao montar componente
  useEffect(() => {
    delete (window as any).pendingMovements;
    return () => {
      // Limpar ao desmontar também
      delete (window as any).pendingMovements;
    };
  }, []);

  // Cafés ordenados alfabeticamente
  const sortedCoffees = [...state.coffees].sort((a, b) => a.name.localeCompare(b.name));

  // Cafés disponíveis para saída
  // Filtra cafés que ainda têm PRs disponíveis (não selecionados em outras entradas)
  const getAvailableCoffeesForSaida = (currentEntryId?: string) => {
    return sortedCoffees.filter(coffee => {
      const totalStock = coffee.roasts.reduce((sum, roast) => sum + roast.quantity, 0);

      // Permitir se tiver initialData com esse café (modo edição)
      if (initialData && coffee.id === initialData.coffeeId) return true;

      if (totalStock === 0) return false;

      // Para saídas, verificar se há PRs disponíveis para este café
      // considerando as selecionadas em OUTRAS entradas (não a atual!)
      if (movementType === 'saida') {
        // Coletar todos os PRs deste café já selecionados em OUTRAS entradas
        const selectedPRsInOtherEntries = new Set<string>();

        entries.forEach(entry => {
          // SKIP da entrada atual - isso permite que o café continue visível
          if (currentEntryId && entry.id === currentEntryId) return;

          // Considerar apenas outras entradas deste mesmo café
          if (entry.coffeeId === coffee.id) {
            entry.prLines.forEach(line => {
              if (line.pr) selectedPRsInOtherEntries.add(line.pr);
            });
          }
        });

        // Verificar se há algum PR com estoque e não selecionado
        const hasAvailablePR = coffee.roasts.some(roast =>
          roast.quantity > 0 && !selectedPRsInOtherEntries.has(roast.pr)
        );

        return hasAvailablePR;
      }

      return true;
    });
  };


  // Popular formulário com initialData quando estiver editando
  useEffect(() => {
    if (initialData) {
      // Definir tipo
      setValue('type', initialData.type);

      // Popular entrada com dados iniciais
      setEntries([{
        id: crypto.randomUUID(),
        coffeeId: initialData.coffeeId,
        date: initialData.timestamp ? initialData.timestamp.split('T')[0] : new Date().toISOString().split('T')[0],
        prLines: [{
          id: crypto.randomUUID(),
          pr: initialData.pr,
          quantity: initialData.quantity.toString()
        }],
        observations: initialData.observations || ''
      }]);
    }
  }, [initialData, setValue]); // Removed movementType and state.coffees from dependencies to avoid reset loops

  // Limpar erros de PR e revalidar ao mudar o tipo de movimentação
  useEffect(() => {
    setPrErrors({}); // Limpa erros anteriores

    if (movementType === 'entrada') {
      // Revalidar todas as linhas se voltar para entrada
      entries.forEach(entry => {
        entry.prLines.forEach(line => {
          if (line.pr) {
            validatePr(entry.id, line.id, line.pr);
          }
        });
      });
    }
  }, [movementType]);

  // Detectar mudanças no formulário
  useEffect(() => {
    const hasData = entries.some(entry =>
      entry.coffeeId ||
      entry.observations ||
      (movementType === 'entrada' && entry.date !== new Date().toISOString().split('T')[0]) ||
      entry.prLines.some(line => line.pr || line.quantity)
    );
    setHasUnsavedChanges(hasData);
  }, [entries, movementType]);

  // Interceptar requestClose do modal pai
  useEffect(() => {
    if (onRequestClose && hasUnsavedChanges) {
      // Substituir a função onRequestClose por nossa função com confirmação
      window.movementFormRequestClose = () => {
        setShowExitConfirm(true);
      };
    }
    return () => {
      delete window.movementFormRequestClose;
    };
  }, [onRequestClose, hasUnsavedChanges]);

  // Handler para cancelar com confirmação
  const handleCancelClick = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirm(true);
    } else {
      // Limpar dados pendentes ao cancelar
      delete (window as any).pendingMovements;
      // Se não tem dados, fecha direto
      if (onCancel) onCancel();
      if (onRequestClose) onRequestClose();
    }
  };

  // Handler para fechar modal (chamado pelo X do modal)
  const handleModalClose = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirm(true);
    } else {
      // Limpar dados pendentes ao fechar sem salvar
      delete (window as any).pendingMovements;
      if (onRequestClose) onRequestClose();
    }
  };

  // Expor handleModalClose para o Dashboard poder chamar
  useEffect(() => {
    if (onRequestClose) {
      // Guardar referência para Dashboard usar
      (window as any).__movementFormCloseHandler = handleModalClose;
      return () => {
        delete (window as any).__movementFormCloseHandler;
      };
    }
  }, [hasUnsavedChanges, onRequestClose]);

  // ============ FUNÇÕES DE GERENCIAMENTO DE ENTRADAS ============

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        id: crypto.randomUUID(),
        coffeeId: '',
        date: new Date().toISOString().split('T')[0],
        prLines: [{ id: crypto.randomUUID(), pr: '', quantity: '' }],
        observations: ''
      }
    ]);
  };

  const removeEntry = (entryId: string) => {
    if (entries.length === 1) {
      showToast('Deve haver pelo menos uma entrada', 'error');
      return;
    }
    setEntries(entries.filter(e => e.id !== entryId));
  };

  const updateEntry = (entryId: string, field: 'coffeeId' | 'date' | 'observations', value: string) => {
    setEntries(entries.map(entry => {
      if (entry.id === entryId) {
        // Atualizar campo sem resetar dados
        return { ...entry, [field]: value };
      }
      return entry;
    }));
  };

  // ============ FUNÇÕES DE GERENCIAMENTO DE PRS ============

  const addPrLine = (entryId: string) => {
    setEntries(entries.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          prLines: [
            ...entry.prLines,
            { id: crypto.randomUUID(), pr: '', quantity: '' }
          ]
        };
      }
      return entry;
    }));
  };

  const removePrLine = (entryId: string, prLineId: string) => {
    setEntries(entries.map(entry => {
      if (entry.id === entryId) {
        if (entry.prLines.length === 1) {
          showToast('Deve haver pelo menos um PR', 'error');
          return entry;
        }
        return {
          ...entry,
          prLines: entry.prLines.filter(line => line.id !== prLineId)
        };
      }
      return entry;
    }));
  };

  // ============ VALIDAÇÃO EM TEMPO REAL ============

  const validatePr = async (entryId: string, prLineId: string, prValue: string) => {
    const key = `${entryId}-${prLineId}`;

    // 1. Limpar erro se vazio
    if (!prValue) {
      setPrErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
      return;
    }

    // 2. Validação Local: Duplicidade no mesmo formulário
    let isDuplicateLocal = false;
    entries.forEach(e => {
      e.prLines.forEach(line => {
        // Ignorar a própria linha que está sendo editada
        if (e.id === entryId && line.id === prLineId) return;

        // Se encontrar o mesmo PR em outra linha
        if (line.pr === prValue) {
          isDuplicateLocal = true;
        }
      });
    });

    if (isDuplicateLocal) {
      setPrErrors(prev => ({ ...prev, [key]: 'PR duplicado neste formulário' }));
      return;
    }

    // Se passou na local, limpar erro por enquanto (antes de checar global)
    setPrErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });

    // 3. Validação Global: Apenas para Entradas
    if (movementType === 'entrada') {
      const entry = entries.find(e => e.id === entryId);
      if (!entry || !entry.coffeeId) return; // Precisa do café selecionado

      setValidatingPrs(prev => ({ ...prev, [key]: true }));

      try {
        // Debounce simples: usar setTimeout não funciona bem aqui sem ref, 
        // mas como é async await, o último a chegar define o estado.
        // Melhor seria um hook de useDebounce, mas vamos fazer a chamada direta
        // e confiar que o usuário não digita tão rápido a ponto de spammar o banco (4 digitos).
        // Para produção robusta: useDebounce.

        // Verificar se esse PR já existe para OUTRO café
        const { data, error } = await supabase
          .from('movements')
          .select('coffee_id, coffees(name)')
          .eq('pr', prValue)
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const existingCoffeeId = data[0].coffee_id;
          // @ts-ignore
          const existingCoffeeName = data[0].coffees?.name || 'outro café';

          if (existingCoffeeId !== entry.coffeeId) {
            setPrErrors(prev => ({ ...prev, [key]: `PR já pertence ao café "${existingCoffeeName}"` }));
          }
        }
      } catch (err) {
        console.error("Erro validando PR:", err);
      } finally {
        setValidatingPrs(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      }
    }
  };

  const updatePrLine = (entryId: string, prLineId: string, field: 'pr' | 'quantity', value: string) => {
    setEntries(entries.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          prLines: entry.prLines.map(line =>
            line.id === prLineId ? { ...line, [field]: value } : line
          )
        };
      }
      return entry;
    }));

    // Acionar validação se for campo PR
    if (field === 'pr') {
      // Pequeno delay para não validar a cada caractere se estiver digitando muito rápido
      const timeoutId = setTimeout(() => {
        validatePr(entryId, prLineId, value);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  // ============ VALIDAÇÕES PARA SAÍDAS ============

  const getAvailablePRsForCoffee = (coffeeId: string, currentEntryId: string, currentPrLineId: string) => {
    const coffee = state.coffees.find(c => c.id === coffeeId);
    if (!coffee) return [];

    // Coletar PRs já selecionadas
    const selectedPRs = new Set<string>();
    entries.forEach(entry => {
      if (entry.coffeeId === coffeeId) {
        entry.prLines.forEach(prLine => {
          // Não incluir a linha atual (permitir edição)
          if (!(entry.id === currentEntryId && prLine.id === currentPrLineId)) {
            if (prLine.pr) {
              selectedPRs.add(prLine.pr);
            }
          }
        });
      }
    });

    // Filtrar: estoque > 0 E não selecionadas (OU se for o PR original da edição)
    return coffee.roasts.filter(roast => {
      const isOriginalPR = initialData && initialData.coffeeId === coffeeId && initialData.pr === roast.pr;
      return (roast.quantity > 0 || isOriginalPR) && !selectedPRs.has(roast.pr);
    });
  };

  const handlePrChange = (entryId: string, prLineId: string, newPr: string) => {
    const selectedEntry = entries.find(e => e.id === entryId);
    if (!selectedEntry) return;

    // Verificar duplicação
    const isPrAlreadySelected = entries.some(entry => {
      if (entry.coffeeId === selectedEntry.coffeeId) {
        return entry.prLines.some(line =>
          !(entry.id === entryId && line.id === prLineId) && line.pr === newPr
        );
      }
      return false;
    });

    if (isPrAlreadySelected) {
      showToast('Este PR já foi selecionado. Escolha outro.', 'error');
      return;
    }

    updatePrLine(entryId, prLineId, 'pr', newPr);
  };

  // ============ VALIDAÇÃO E SUBMIT ============

  const handleContinue = async () => {
    setIsValidating(true);
    try {
      const movementsToCreate = [];

      // Validar todas entries e prLines
      for (const entry of entries) {
        if (!entry.coffeeId) {
          showToast('Selecione o café em todas as entradas', 'error');
          return;
        }

        if (movementType === 'entrada' && !entry.date) {
          showToast('Preencha a data em todas as entradas', 'error');
          return;
        }

        // Validar data futura
        if (movementType === 'entrada') {
          const today = new Date().toISOString().split('T')[0];
          if (entry.date > today) {
            showToast('Somente datas passadas ou atual são permitidas', 'error');
            return;
          }
        }

        // Validar PRs duplicados dentro da mesma entrada (saídas)
        if (movementType === 'saida') {
          const prsInEntry = entry.prLines.map(line => line.pr).filter(pr => pr);
          const uniquePRs = new Set(prsInEntry);
          if (prsInEntry.length !== uniquePRs.size) {
            showToast('PRs duplicados detectados. Remova as duplicatas antes de continuar.', 'error');
            return;
          }
        }

        for (const prLine of entry.prLines) {
          if (!prLine.pr || !prLine.quantity) {
            showToast('Preencha PR e Quantidade em todas as linhas', 'error');
            return;
          }

          const quantity = Number(prLine.quantity);
          if (quantity <= 0) {
            showToast('Quantidade deve ser maior que zero', 'error');
            return;
          }

          // Validação específica para saídas
          if (movementType === 'saida') {
            const coffee = state.coffees.find(c => c.id === entry.coffeeId);
            if (coffee) {
              const roast = coffee.roasts.find(r => r.pr === prLine.pr);

              // Calcular estoque efetivo (se edição, somar a quantidade original)
              let effectiveStock = roast ? roast.quantity : 0;
              if (initialData && initialData.coffeeId === entry.coffeeId && initialData.pr === prLine.pr) {
                // Se roast não existe mais (foi deletado/zerado?), assumimos 0 + original
                effectiveStock += initialData.quantity;
              }

              // Se roast não existe e não é o original, erro
              if (!roast && (!initialData || initialData.pr !== prLine.pr)) {
                showToast(`PR ${prLine.pr} não encontrado no estoque`, 'error');
                return;
              }

              if (effectiveStock < quantity) {
                showToast(`Estoque insuficiente para PR ${prLine.pr}. Disponível: ${effectiveStock}g`, 'error');
                return;
              }
            }
          }

          // Validar PR duplicado no banco (entradas)
          if (movementType === 'entrada') {
            const isDuplicate = await checkPrExists(entry.coffeeId, prLine.pr);
            if (isDuplicate) {
              showToast(`PR ${prLine.pr} já existe para este café`, 'error');
              return;
            }
          }

          const timestamp = movementType === 'entrada'
            ? new Date(`${entry.date}T${new Date().toTimeString().split(' ')[0]}`).toISOString()
            : new Date().toISOString();

          movementsToCreate.push({
            type: movementType,
            coffeeId: entry.coffeeId,
            pr: prLine.pr,
            quantity,
            observations: entry.observations, // ← Agora por entrada!
            responsible: user?.user_metadata?.name || user?.email || 'Usuário',
            timestamp,
          });
        }
      }

      // Criar batch_id se múltiplas
      if (movementsToCreate.length > 1) {
        const batchId = crypto.randomUUID();
        movementsToCreate.forEach(m => (m as any).batch_id = batchId);
      }

      // Salvar no contexto para exibir resumo
      (window as any).pendingMovements = movementsToCreate;
      setShowSummary(true);
    } finally {
      setIsValidating(false);
    }
  };

  const checkPrExists = async (coffeeId: string, pr: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('movements')
        .select('id')
        .eq('coffee_id', coffeeId)
        .eq('pr', pr)
        .limit(1);

      if (error) throw error;
      return (data && data.length > 0);
    } catch (error) {
      console.error('Erro ao verificar PR:', error);
      return false;
    }
  };

  const handleConfirm = async () => {
    if (!user) {
      showToast('Erro: Usuário não identificado', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const movements = (window as any).pendingMovements || [];

      if (movements.length > 1) {
        if (initialData) {
          showToast('Edição em massa não suportada', 'error');
          return;
        }
        await actions.addMultipleMovements(movements);
      } else if (movements.length === 1) {
        if (initialData) {
          await actions.updateMovement(initialData.id, movements[0]);
        } else {
          await actions.addMovement(movements[0]);
        }
      }

      if (onSuccess) onSuccess();

      // Limpar dados pendentes após sucesso
      delete (window as any).pendingMovements;
    } catch (error) {
      console.error(error);
      showToast('Erro ao salvar movimentações', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setShowSummary(false);
  };

  // ============ RENDERIZAÇÃO ============

  // Card de Resumo
  if (showSummary) {
    const movements = (window as any).pendingMovements || [];
    const totalQuantity = movements.reduce((sum: number, m: any) => sum + m.quantity, 0);

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-2xl font-bold text-espresso-800 dark:text-espresso-200 flex items-center gap-2">
            <Check className="w-6 h-6" />
            Resumo da Movimentação
          </h2>

          <div className="space-y-4">
            <div className="bg-natural-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm font-bold text-black dark:text-white mb-2">Total Geral</p>
              <p className="text-2xl font-bold text-espresso-600 dark:text-espresso-400">{totalQuantity}g</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{movements.length} movimentação(ões)</p>
            </div>

            {movements.map((mov: any, idx: number) => {
              const coffee = state.coffees.find(c => c.id === mov.coffeeId);
              return (
                <div key={idx} className="border-l-4 border-espresso-500 pl-4 py-2">
                  <p className="font-bold text-black dark:text-white">{coffee?.name || 'Café'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">PR: {mov.pr} • {mov.quantity}g</p>
                  {mov.observations && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 italic mt-1">
                      {mov.observations.length > 60
                        ? `${mov.observations.substring(0, 60)}...`
                        : mov.observations}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleEdit}
              className="flex-1 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2"
            >
              <Edit2 size={18} />
              Editar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1 py-3 text-sm font-bold text-white bg-espresso-600 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Salvando...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Confirmar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Formulário Principal
  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }} className="space-y-4">
        {/* Tipo */}
        <div className="flex gap-4">
          <label className="flex items-center p-4 border border-natural-100 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-natural-50 dark:hover:bg-gray-700 flex-1 justify-center transition-colors">
            <input
              type="radio"
              value="entrada"
              {...register('type', { required: true })}
              className="text-black focus:ring-espresso-500"
            />
            <span className="ml-2 font-bold text-black dark:text-white">Entrada</span>
          </label>
          <label className="flex items-center p-4 border border-natural-100 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-natural-50 dark:hover:bg-gray-700 flex-1 justify-center transition-colors">
            <input
              type="radio"
              value="saida"
              {...register('type', { required: true })}
              className="text-black focus:ring-espresso-500"
            />
            <span className="ml-2 font-bold text-black dark:text-white">Saída</span>
          </label>
        </div>

        {/* Entradas */}
        {entries.map((entry, entryIndex) => {
          const selectedCoffee = state.coffees.find(c => c.id === entry.coffeeId);

          return (
            <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-3">
              {/* Header com X */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-espresso-700 dark:text-espresso-300">
                  {movementType === 'entrada' ? 'Entrada' : 'Saída'} #{entryIndex + 1}
                </h3>
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title={`Remover ${movementType === 'entrada' ? 'entrada' : 'saída'}`}
                  >
                    <X size={20} className="text-red-600" />
                  </button>
                )}
              </div>

              {/* Café + Data */}
              <div className={`grid ${movementType === 'entrada' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1">Café *</label>
                  <select
                    value={entry.coffeeId}
                    onChange={(e) => updateEntry(entry.id, 'coffeeId', e.target.value)}
                    className="w-full h-11 rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium"
                  >
                    <option value="">Selecione...</option>
                    {(movementType === 'saida' ? getAvailableCoffeesForSaida(entry.id) : sortedCoffees).map(coffee => (
                      <option key={coffee.id} value={coffee.id}>{coffee.name}</option>
                    ))}
                  </select>
                </div>

                {movementType === 'entrada' && (
                  <div>
                    <label className="block text-sm font-bold text-black dark:text-white mb-1">Data da Torra *</label>
                    <input
                      type="date"
                      value={entry.date}
                      onChange={(e) => updateEntry(entry.id, 'date', e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full h-11 rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Linhas de PR + Quantidade */}
              {entry.prLines.map((prLine, prIndex) => {
                const availablePRs = movementType === 'saida'
                  ? getAvailablePRsForCoffee(entry.coffeeId, entry.id, prLine.id)
                  : [];

                return (
                  <div key={prLine.id} className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-black dark:text-white mb-1">
                        PR/Lote {prIndex > 0 ? `#${prIndex + 1}` : ''} *
                      </label>
                      {movementType === 'saida' ? (
                        <select
                          value={prLine.pr}
                          onChange={(e) => handlePrChange(entry.id, prLine.id, e.target.value)}
                          disabled={!entry.coffeeId}
                          className="w-full h-11 rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium"
                        >
                          <option value="">Selecione...</option>
                          {availablePRs.map(roast => (
                            <option key={roast.id} value={roast.pr}>
                              {roast.pr}  —  {roast.quantity}g disponível
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={prLine.pr}
                          onChange={(e) => updatePrLine(entry.id, prLine.id, 'pr', e.target.value)}
                          placeholder="Digite o PR"
                          className={`w-full h-11 rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 ${prErrors[`${entry.id}-${prLine.id}`] ? 'border-red-500 focus:border-red-500' : ''}`}
                        />
                      )}
                      {prErrors[`${entry.id}-${prLine.id}`] && (
                        <p className="text-xs whitespace-nowrap text-red-500 mt-1 font-bold">{prErrors[`${entry.id}-${prLine.id}`]}</p>
                      )}
                    </div>

                    <div className="flex gap-2 items-start">
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-black dark:text-white mb-1">Quantidade (g) *</label>
                        <input
                          type="number"
                          value={prLine.quantity}
                          onChange={(e) => updatePrLine(entry.id, prLine.id, 'quantity', e.target.value)}
                          min="1"
                          placeholder="0"
                          className="w-full h-11 rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500"
                        />
                      </div>
                      {prIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => removePrLine(entry.id, prLine.id)}
                          className="mt-7 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Remover PR"
                        >
                          <X size={18} className="text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Botão + Adicionar PR - habilitar apenas se último PR estiver preenchido */}
              {(() => {
                // Pegar última linha de PR
                const lastPrLine = entry.prLines[entry.prLines.length - 1];

                // Verificar se última linha está preenchida (4+ dígitos)
                const lastPRFilled = lastPrLine && lastPrLine.pr && lastPrLine.pr.length >= 4;

                // Para SAÍDA: verificar se ainda há PRs disponíveis para este café
                let hasAvailablePRs = true;
                if (movementType === 'saida' && entry.coffeeId) {
                  const availablePRs = getAvailablePRsForCoffee(entry.coffeeId, entry.id, 'check');
                  hasAvailablePRs = availablePRs.length > 0;
                }

                // Habilitar apenas se última linha preenchida E (para saída) houver PRs disponíveis
                const canAddMorePRs = lastPRFilled && hasAvailablePRs;

                return (
                  <button
                    type="button"
                    onClick={() => addPrLine(entry.id)}
                    disabled={!canAddMorePRs}
                    className={`flex items-center gap-1 text-sm font-medium transition-colors ${!canAddMorePRs
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-espresso-600 dark:text-espresso-400 hover:text-espresso-700 dark:hover:text-espresso-300'
                      }`}
                    title={
                      !lastPRFilled
                        ? 'Selecione um PR antes de adicionar outro campo'
                        : !hasAvailablePRs
                          ? 'Todos os PRs disponíveis já foram selecionados'
                          : 'Adicionar PR'
                    }
                  >
                    <Plus size={16} />
                    <span>Adicionar PR</span>
                  </button>
                );
              })()}

              {/* Observações por entrada */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1">Observações</label>
                <textarea
                  value={entry.observations}
                  onChange={(e) => updateEntry(entry.id, 'observations', e.target.value)}
                  rows={2}
                  placeholder="Detalhes opcionais..."
                  className="w-full h-20 rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>
          );
        })}

        {/* Botão + Adicionar entrada/saída (Desabilitar em edição) */}
        {!initialData && (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={addEntry}
              className="flex items-center gap-2 text-sm text-espresso-600 dark:text-espresso-400 hover:text-espresso-700 dark:hover:text-espresso-300 font-medium transition-colors"
            >
              <Plus size={18} />
              <span>Adicionar {movementType === 'entrada' ? 'entrada' : 'saída'}</span>
            </button>
          </div>
        )}

        {/* Botões finais */}
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={handleCancelClick}
              className="flex-1 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isValidating || Object.keys(prErrors).length > 0}
            className="flex-1 py-3 text-sm font-bold text-white bg-espresso-600 rounded-lg shadow-sm hover:bg-espresso-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Validando...
              </>
            ) : (
              'Continuar'
            )}
          </button>
        </div>
      </form>

      {/* Modal de Confirmação de Saída */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h2 className="text-xl font-bold text-black dark:text-white mb-3">
              Descartar alterações?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Você tem dados não salvos. Se sair agora, todas as alterações serão perdidas.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Continuar editando
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  // Limpar dados pendentes ao descartar
                  delete (window as any).pendingMovements;
                  if (onCancel) onCancel();
                  if (onRequestClose) onRequestClose();
                }}
                className="flex-1 py-2 px-4 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovementForm;
