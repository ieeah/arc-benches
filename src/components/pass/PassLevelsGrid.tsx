import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Check, Lock } from 'lucide-react';
import type { ItemInfo, PassList } from '@/types';
import { useAppStore } from '@/store';
import { useTranslation, getItemName } from '@/i18n';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { CategoryBadge } from '@/components/CategoryBadge';
import { OutfitPartBadge } from '@/components/pass/OutfitPartBadge';
import { CornerBadge } from '@/components/pass/CornerBadge';
import { getOutfitPart, outfitPartLabelKey, outfitPartFrameClass } from '@/lib/outfitParts';
import { ItemDetailSheet } from '@/components/ItemDetailSheet';
import { getTrackName } from '@/lib/rewardPass';
import { cn } from '@/lib/cn';

interface PassLevelsGridProps {
  pass: PassList;
  /** Tier raggiunto: i livelli fino a questo sono mostrati disabilitati. 0 in anteprima. */
  reached: number;
  hiddenTracks: ReadonlySet<string>;
  /** Presente solo per il pass attivo: tocca un livello per segnarlo come raggiunto. */
  onSetTier?: (level: number) => void;
  /** All'apertura scorre al prossimo livello da raggiungere (solo pass attivo). */
  scrollToNext?: boolean;
}

/**
 * Sfondo «spaziale» del pass del gioco, adattato al mobile: notte profonda, alone e poche stelle. Sta in un
 * livello `sticky` alto quanto la finestra: scorrono solo i livelli, lo sfondo resta fermo nel riquadro.
 */
const SPACE_LAYER: CSSProperties = {
  backgroundImage: [
    'radial-gradient(ellipse 80% 38% at 78% 6%, rgba(80, 96, 230, 0.22), transparent 70%)',
    'radial-gradient(ellipse 70% 30% at 8% 96%, rgba(120, 70, 200, 0.14), transparent 70%)',
    'radial-gradient(1px 1px at 12px 20px, rgba(255,255,255,0.55), transparent)',
    'radial-gradient(1px 1px at 74px 92px, rgba(255,255,255,0.4), transparent)',
    'radial-gradient(1.5px 1.5px at 124px 44px, rgba(255,255,255,0.5), transparent)',
  ].join(', '),
  backgroundSize: 'auto, auto, 160px 130px, 160px 130px, 160px 130px',
};

/**
 * Vista del pass come nel gioco: scorrimento verticale con i livelli numerati sulla sinistra (il più
 * alto in cima) e le tracce affiancate, ogni ricompensa come icona dell'oggetto; quelle delle tracce
 * a pagamento hanno il lucchetto. I livelli già raggiunti sono disabilitati, il prossimo è evidenziato.
 */
export const PassLevelsGrid = ({ pass, reached, hiddenTracks, onSetTier, scrollToNext = false }: PassLevelsGridProps) => {
  const { t, language } = useTranslation();
  const itemsInfo = useAppStore((s) => s.itemsInfo);
  const refinerLevel = useAppStore((s) => s.getRefinerLevel());
  const [detail, setDetail] = useState<ItemInfo | null>(null);
  const tracks = useMemo(() => pass.tracks.filter((tr) => !hiddenTracks.has(tr.id)), [pass.tracks, hiddenTracks]);
  const levels = useMemo(() => [...pass.levels].sort((a, b) => b.level - a.level), [pass.levels]);
  const nextLevel = Math.min(reached + 1, pass.maxLevel);
  const nextRef = useRef<HTMLDivElement | null>(null);
  const firstTrackId = pass.tracks[0]?.id;

  useEffect(() => {
    if (scrollToNext) nextRef.current?.scrollIntoView({ block: 'center' });
  }, [scrollToNext, pass.id]);

  if (tracks.length === 0) {
    return <p className="p-4 text-xs text-center text-gray-400">{t('rewardPass.noTrackVisible')}</p>;
  }

  return (
    // `overflow-clip` (non `hidden`) per tenere il bordo arrotondato senza rompere lo `sticky` dello sfondo
    <div style={{ backgroundColor: '#04050d' }} className="relative rounded-[24px] border border-white/10 overflow-clip pb-1.5 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div style={SPACE_LAYER} className="sticky top-0 h-dvh overflow-hidden">
          {/* Anello decorativo dello sfondo del gioco */}
          <div className="absolute -right-1/3 top-[10%] aspect-square w-[110%] rounded-full border border-white/15" />
        </div>
      </div>

      {/* Binario verticale dei livelli */}
      <div aria-hidden className="pointer-events-none absolute left-[34px] top-0 bottom-0 w-0.5 bg-white/15" />

      <div className="relative flex items-center gap-2 px-3 py-2.5 bg-black/40 text-[10px] font-black uppercase tracking-wider text-white/60">
        <span className="w-11 shrink-0 text-center">{t('rewardPass.levelAbbr')}</span>
        {tracks.map((track) => (
          <span key={track.id} className="flex-1 min-w-0 truncate flex items-center gap-1">
            {track.locked && <Lock size={10} className="shrink-0" />}
            {getTrackName(track, language)}
          </span>
        ))}
      </div>

      {levels.map((lvl, idx) => {
        const done = lvl.level <= reached;
        const isNext = onSetTier !== undefined && lvl.level === nextLevel && reached < pass.maxLevel;
        return (
          <Fragment key={lvl.level}>
          {/* Divisore fra i livelli, inset come le righe */}
          {idx > 0 && <div aria-hidden className="relative mx-4 h-px bg-white/5" />}
          <div
            ref={isNext ? nextRef : undefined}
            // raggio concentrico a quello del riquadro: 24px − 1px di bordo − 6px di margine
            className={cn(
              'relative mx-1.5 flex items-center gap-2 rounded-[17px] px-1.5 py-2 transition-colors',
              isNext && 'bg-purple-500/15 ring-2 ring-purple-400',
            )}
          >
            <div className="w-11 shrink-0 flex justify-center">
              {onSetTier ? (
                <button
                  type="button"
                  onClick={() => onSetTier(lvl.level === reached ? lvl.level - 1 : lvl.level)}
                  aria-label={`${t('rewardPass.setTierHere')} (${lvl.level})`}
                  title={t('rewardPass.setTierHere')}
                  className={cn(
                    'h-8 min-w-9 px-2 rounded-full text-xs font-black flex items-center justify-center border-2 cursor-pointer',
                    done
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-[#0b0d1c] border-white/70 text-white hover:border-purple-400',
                  )}
                >
                  {done ? <Check size={14} strokeWidth={3} /> : lvl.level}
                </button>
              ) : (
                <span className="h-8 min-w-9 px-2 rounded-full bg-[#0b0d1c] border-2 border-white/70 text-xs font-black flex items-center justify-center">{lvl.level}</span>
              )}
            </div>

            {tracks.map((track) => {
              const rewards = (lvl.rewards ?? []).filter((r) => (r.track ?? firstTrackId) === track.id);
              return (
                <div key={track.id} className={cn('flex-1 min-w-0 flex flex-wrap gap-1.5', done && 'opacity-40')}>
                  {rewards.length === 0 && <span className="text-xs text-white/20 px-1">—</span>}
                  {rewards.map((reward, i) => {
                    const info = itemsInfo[reward.itemId];
                    const name = info ? getItemName(info, language) || reward.itemId : reward.itemId;
                    const part = getOutfitPart(info);
                    const partLabel = part ? t(outfitPartLabelKey(part)) : '';
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={!info}
                        onClick={() => info && setDetail(info)}
                        aria-label={`${name}${partLabel ? `, ${partLabel}` : ''}${reward.quantity > 1 ? ` ×${reward.quantity}` : ''}${track.locked ? ` (${getTrackName(track, language)})` : ''}`}
                        title={partLabel ? `${name} · ${partLabel}` : name}
                        className={cn('relative w-16 h-16 shrink-0 cursor-pointer disabled:cursor-default rounded-[14px]')}
                      >
                        <ItemCardFrameV2
                          icon={info?.icon}
                          alt={name}
                          rarity={info?.rarity}
                          fallbackText={reward.itemId}
                          thumb
                          borderRadius={14}
                          className="w-full h-full bg-[#080a18]"
                          categoryBadge={<CategoryBadge itemType={info?.item_type} subcategory={info?.subcategory} bare />}
                          barRightSlot={reward.quantity > 1 ? `×${reward.quantity}` : undefined}
                        />
                        {part && <span aria-hidden className={cn('pointer-events-none absolute -inset-1 rounded-[18px] squircle', outfitPartFrameClass(part))} />}
                        {/* Spille agli angoli, a cavallo del bordo: non coprono l'icona */}
                        {part && <span className="absolute -top-1.5 -left-1.5 z-10"><OutfitPartBadge part={part} /></span>}
                        {track.locked && (
                          <span className="absolute -top-1.5 -right-1.5 z-10">
                            <CornerBadge className="bg-sky-500"><Lock size={11} className="text-white" strokeWidth={2.75} aria-hidden /></CornerBadge>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          </Fragment>
        );
      })}

      {detail && <ItemDetailSheet item={detail} refinerLevel={refinerLevel} onClose={() => setDetail(null)} />}
    </div>
  );
};
