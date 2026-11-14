/**
 * Risolve l'item sbloccato da un Blueprint o Design.
 *
 * Utilizzato da scripts/fetch-items.mjs per popolare il campo unlocks_item_id
 * nel catalogo degli oggetti.
 */

function isBlueprint(item) {
  if (!item) return false;
  return (
    item.item_type === 'Blueprint' ||
    item.subcategory === 'Blueprint' ||
    (typeof item.id === 'string' && (item.id.endsWith('-blueprint') || item.id.endsWith('-recipe')))
  );
}

function isDesign(item) {
  if (!item) return false;
  return item.item_type === 'Design' || item.subcategory === 'Design';
}

/**
 * Risolve l'ID dell'oggetto sbloccato da un blueprint o design.
 *
 * @param {Object} item L'oggetto da verificare (deve avere id, name, item_type, ecc.)
 * @param {Record<string, Object>} itemsMap Mappa di tutti gli oggetti per ID
 * @param {Object} baseItemsMap Mappa degli oggetti base (da item-variants.json)
 * @returns {string | null} ID dell'oggetto sbloccato, oppure null se non risolvibile o non applicabile
 */
export function resolveUnlocksItemId(item, itemsMap, baseItemsMap = {}) {
  if (!item) return null;

  if (!isBlueprint(item) && !isDesign(item)) {
    return null;
  }

  // 1. Logica per Design (arredi / personalizzazione rifugio)
  if (isDesign(item)) {
    const strippedId = item.id.replace(/-design$/, '');
    if (itemsMap[strippedId]) {
      return strippedId;
    }
    return null;
  }

  // 2. Casi speciali noti per Blueprint
  if (item.id === 'combat-mk-3-flanking') {
    return 'combat-mk-3-aggressive';
  }

  // 3. Verifica corrispondenza con baseItems (armi con varianti o ricette mappate)
  const bases = Object.values(baseItemsMap.baseItems ?? baseItemsMap);
  for (const base of bases) {
    if (base && base.blueprintItemId === item.id) {
      if (Array.isArray(base.variantItemIds)) {
        const tier1 = base.variantItemIds.find(vId => vId.endsWith('-i') && itemsMap[vId]);
        if (tier1) return tier1;
        const anyVariant = base.variantItemIds.find(vId => itemsMap[vId]);
        if (anyVariant) return anyVariant;
      }
      if (itemsMap[base.id]) return base.id;
      if (base.id) return base.id;
    }
  }

  // 4. Rimozione suffisso -(recipe|blueprint|bp)$
  const strippedId = item.id.replace(/-(recipe|blueprint|bp)$/, '');
  if (itemsMap[strippedId] && !isBlueprint(itemsMap[strippedId])) {
    return strippedId;
  }
  if (itemsMap[`${strippedId}-i`]) {
    return `${strippedId}-i`;
  }

  // 5. Match per nome pulito (rimuove il suffisso Blueprint/Recipe/Schema)
  if (item.name) {
    const cleanName = item.name.replace(/\s+(Blueprint|Recipe|Schema)$/i, '').trim().toLowerCase();

    // Corrispondenza esatta per nome pulito
    for (const candidate of Object.values(itemsMap)) {
      if (!isBlueprint(candidate) && candidate.name && candidate.name.toLowerCase() === cleanName) {
        return candidate.id;
      }
    }

    // Corrispondenza che inizia per nome pulito
    for (const candidate of Object.values(itemsMap)) {
      if (!isBlueprint(candidate) && candidate.name && candidate.name.toLowerCase().startsWith(cleanName)) {
        return candidate.id;
      }
    }
  }

  return null;
}
