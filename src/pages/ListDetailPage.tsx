import { ArrowLeft, Check } from 'lucide-react';
import { useAppStore } from '../store';
import { SectionHeader } from '../components/SectionHeader';
import { IconButton } from '../components/IconButton';
import { LevelPills } from '../components/LevelPills';
import { ActionCheckbox } from '../components/ActionCheckbox';
import { iconUrl } from '../lib/icons';
import { getRarityStyles } from '../lib/rarity';
import { getBaseLevel } from '../lib/lists';
import { cn } from '../lib/cn';

/** Full-screen overview of one list: every level, its items and actions. */
export const ListDetailPage = ({ listId, onBack, onOpenDatabase }: {
  listId: string;
  onBack: () => void;
  onOpenDatabase: () => void;
}) => {
  const store = useAppStore();
  const list = store.getAllLists().find(l => l.id === listId);

  if (!list) {
    return (
      <div className="p-4">
        <SectionHeader title="Lista non trovata"
          leading={<IconButton onClick={onBack} title="Indietro"><ArrowLeft size={14} className="text-gray-500" /></IconButton>}
          onOpenDatabase={onOpenDatabase} />
      </div>
    );
  }

  const current = store.hideoutLevels[list.id] ?? 0;
  const selected = store.targetLevels[list.id] ?? [];
  const baseLevel = getBaseLevel(list);
  const levels = [...list.levels].sort((a, b) => a.level - b.level);

  const setCurrent = (v: number) => store.setModuleCurrentLevel(list.id, v, v > current);

  return (
    <div className="pb-28">
      <div className="px-4 pt-4 pb-3 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 border-b border-gray-200 dark:border-gray-800">
        <SectionHeader title={list.name}
          leading={<IconButton onClick={onBack} title="Indietro"><ArrowLeft size={14} className="text-gray-500" /></IconButton>}
          onOpenDatabase={onOpenDatabase} />
        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Livello Attuale</p>
          <LevelPills min={baseLevel} max={list.maxLevel} value={current}
            activeClass="bg-blue-500 text-white" onChange={setCurrent} />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {levels.map(lvl => {
          const done = lvl.level <= current;
          const inObjectives = selected.includes(lvl.level);
          return (
            <div key={lvl.level}
              className={cn(
                'border rounded-[20px] p-3',
                done ? 'border-green-200 dark:border-green-900/50 bg-green-50/40 dark:bg-green-900/10'
                     : 'border-gray-200 dark:border-gray-800',
              )}>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Livello {lvl.level}</span>
                  {done && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                      <Check size={12} strokeWidth={3} /> Fatto
                    </span>
                  )}
                </div>
                <button onClick={() => store.toggleTargetLevel(list.id, lvl.level)}
                  className={cn(
                    'text-[10px] font-bold uppercase px-2.5 py-1 rounded-full transition-colors shrink-0',
                    inObjectives ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500',
                  )}>
                  {inObjectives ? 'Obiettivo' : 'Ignorato'}
                </button>
              </div>

              {lvl.requirementItemIds.length > 0 && (
                <div className="space-y-2">
                  {lvl.requirementItemIds.map(req => {
                    const info = store.itemsInfo[req.itemId];
                    const { color } = getRarityStyles(info?.rarity ?? '');
                    const owned = store.inventory[req.itemId] ?? 0;
                    const enough = done || owned >= req.quantity;
                    return (
                      <div key={req.itemId} className="flex items-center gap-2.5">
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                          {info?.icon
                            ? <img src={iconUrl(info.icon)} alt={info.name} loading="lazy" decoding="async" className="max-w-[85%] max-h-[85%] object-contain" />
                            : <span className="text-[7px] text-gray-400">{req.itemId}</span>}
                          <div className={cn('absolute bottom-0 left-0 right-0 h-1', color)} />
                        </div>
                        <span className="flex-1 min-w-0 text-sm font-semibold truncate">{info?.name ?? req.itemId}</span>
                        <span className={cn(
                          'text-xs font-bold font-mono shrink-0',
                          enough ? 'text-green-600 dark:text-green-400' : 'text-gray-400',
                        )}>
                          {done ? `${req.quantity}` : `${Math.min(owned, req.quantity)}/${req.quantity}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {(lvl.actions?.length ?? 0) > 0 && (
                <div className={cn('space-y-1', lvl.requirementItemIds.length > 0 && 'mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800')}>
                  {lvl.actions!.map(action => (
                    <ActionCheckbox key={action.id}
                      label={action.label}
                      checked={store.checkedActions[`${list.id}|${lvl.level}|${action.id}`] ?? false}
                      onToggle={() => store.toggleAction(list.id, lvl.level, action.id)}
                    />
                  ))}
                </div>
              )}

              {lvl.requirementItemIds.length === 0 && (lvl.actions?.length ?? 0) === 0 && (
                <p className="text-xs text-gray-400 italic">Nessun oggetto o azione.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
