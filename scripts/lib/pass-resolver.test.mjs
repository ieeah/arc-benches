import { describe, it, expect } from 'vitest';
import { classify, normName, parseRewardName, resolveReward, slug } from './pass-resolver.mjs';

const ctx = {
  catalog: new Map([
    ['caposta outfit', 'caposta-outfit'],
    ['bantam i', 'bantam-i'],
    ['medium shield', 'medium-shield'],
    ['tactical mk 2', 'tactical-mk-2'],
    ['banana backpack charm', 'banana-backpack-charm'],
    ['fortuna stencil', 'fortuna-stencil'],
  ]),
  cosmetics: new Map([
    ['outfit', new Map([['caposta', { id: 'outfit-caposta', names: { en: 'Caposta', it: 'Caposta' } }]])],
    ['emote', new Map([['choo choo', { id: 'emote-choo-choo', names: { en: 'Choo-Choo', it: 'Ciuf-ciuf' } }]])],
    ['face-style', new Map([['tribal sheep face', { id: 'face-style-tribal-sheep-face', names: { en: 'Tribal Sheep Face', it: 'Volto tribale di pecora' } }]])],
    ['scrappy-outfit', new Map([['conductor hat', { id: 'scrappy-outfit-conductor-hat', names: { en: 'Conductor Hat', it: 'Cappello da capitano' } }]])],
  ]),
  atItems: new Map([
    ['bar table', { id: 'bar-table', names: { en: 'Bar Table' }, descriptions: {}, type: 'Outpost Furniture' }],
    ['sacrifice', { id: 'sacrifice', names: { en: 'Sacrifice' }, descriptions: {}, type: 'Stencil' }],
  ]),
};

describe('normName / slug', () => {
  it('normalizes punctuation and case; the slug is hyphen-case', () => {
    expect(normName('Caposta (Outfit)')).toBe('caposta outfit');
    expect(normName("Dragon's Breath")).toBe('dragons breath');
    expect(slug('Tactical Mk. 2')).toBe('tactical-mk-2');
  });
});

describe('parseRewardName / classify', () => {
  it('extracts the quantity and the Scrappy marker', () => {
    expect(parseRewardName('3 stencil parts')).toEqual({ quantity: 3, text: 'stencil parts', scrappy: false });
    expect(parseRewardName('Conductor hat (Scrappy)')).toEqual({ quantity: 1, text: 'Conductor hat', scrappy: true });
    expect(parseRewardName('Stencil parts').quantity).toBe(1);
  });

  it('recognizes the kind from the game keywords', () => {
    const kind = (raw) => classify(parseRewardName(raw)).kind;
    expect(kind('Caposta outfit')).toBe('outfit');
    expect(kind('Caposta outfit accessories')).toBe('outfit-piece');
    expect(kind('Banana backpack charm')).toBe('backpack-charm');
    expect(kind('Train whistle backpack attachment')).toBe('backpack-attachment');
    expect(kind('Steamwright backpack')).toBe('backpack');
    expect(kind('Short dreads hairstyle')).toBe('hair');
    expect(kind('Bantam I hand cannon')).toBe('item');
    expect(kind('Deadwire helmet (Scrappy)')).toBe('scrappy-outfit');
  });
});

describe('resolveReward', () => {
  it('finds catalog items, also ignoring weapon class words and plurals', () => {
    expect(resolveReward('Caposta outfit', ctx)).toMatchObject({ status: 'catalog', itemId: 'caposta-outfit', quantity: 1 });
    expect(resolveReward('Bantam I hand cannon', ctx)).toMatchObject({ status: 'catalog', itemId: 'bantam-i' });
    expect(resolveReward('2 medium shields', ctx)).toMatchObject({ status: 'catalog', itemId: 'medium-shield', quantity: 2 });
    expect(resolveReward('Tactical Mk. 2 augment', ctx)).toMatchObject({ status: 'catalog', itemId: 'tactical-mk-2' });
    expect(resolveReward('Banana backpack charm', ctx)).toMatchObject({ status: 'catalog', itemId: 'banana-backpack-charm' });
    expect(resolveReward('Fortuna stencil', ctx)).toMatchObject({ status: 'catalog', itemId: 'fortuna-stencil' });
  });

  it('creates outfit pieces with the MetaForge naming convention', () => {
    const toggle = resolveReward('Caposta outfit accessories', ctx);
    expect(toggle.create).toMatchObject({ id: 'accessories-caposta-variant', name: 'Accessories (Caposta Variant)', subcategory: 'Outfit Variant', outfitNameIt: 'Caposta' });
    const colors = resolveReward('Caposta outfit colors', ctx);
    expect(colors.create).toMatchObject({ id: 'colors-caposta-color', name: 'Colors (Caposta Color)', subcategory: 'Outfit Color' });
  });

  it('creates cosmetics from ARC Tracker with the Italian name from the site', () => {
    const emote = resolveReward('Choo-Choo emote', ctx);
    expect(emote).toMatchObject({ status: 'create' });
    expect(emote.create).toMatchObject({ id: 'choo-choo-emote', name: 'Choo-Choo (Emote)', subcategory: 'Emote' });
    expect(emote.create.cosmetic.names.it).toBe('Ciuf-ciuf');
    expect(resolveReward('Conductor hat (Scrappy)', ctx).create).toMatchObject({ id: 'conductor-hat-scrappy-outfit', subcategory: 'Scrappy Outfit' });
  });

  it('accepts a unique name prefix when the site spells the name longer', () => {
    expect(resolveReward('Tribal Sheep face style', ctx).create.cosmetic.id).toBe('face-style-tribal-sheep-face');
  });

  it('creates furniture, stencils and the token currency from ARC Tracker items or by hand', () => {
    expect(resolveReward('Bar table furniture', ctx).create).toMatchObject({ source: 'arctracker-item', id: 'bar-table' });
    expect(resolveReward('Sacrifice stencil', ctx).create).toMatchObject({ source: 'arctracker-item', id: 'sacrifice-stencil', name: 'Sacrifice (Stencil)' });
    expect(resolveReward('200 raider tokens', ctx)).toMatchObject({ status: 'create', quantity: 200 });
    expect(resolveReward('200 raider tokens', ctx).create).toMatchObject({ id: 'raider-tokens', kind: 'currency' });
  });

  it('reports what it cannot resolve', () => {
    expect(resolveReward('Totally unknown thing', ctx).status).toBe('unresolved');
    expect(resolveReward('Nobody emote', ctx).status).toBe('unresolved');
  });
});
