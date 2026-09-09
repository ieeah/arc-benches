import { useTranslation } from '@/i18n';

const SOURCES = [
  { label: 'MetaForge', href: 'https://metaforgehq.com/' },
  { label: 'ARDB', href: 'https://ardb.cc/' },
  { label: 'RaidTheory', href: 'https://raidtheory.com/' },
  { label: 'ARC Raiders Wiki', href: 'https://arc-raiders.fandom.com/' },
];

export const AppFooter = () => {
  const { t } = useTranslation();

  return (
    <footer className="px-6 pb-28 pt-8 text-center space-y-2.5 select-none">
      <p className="text-[10px] text-gray-400/70 dark:text-gray-600/70 leading-relaxed">
        {t('footer.nonAffiliation')}
      </p>
      <p className="text-[10px] text-gray-400/70 dark:text-gray-600/70 leading-relaxed">
        {t('footer.dataAttribution')}{' '}
        {SOURCES.map((src, i) => (
          <span key={src.href}>
            <a
              href={src.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
            >
              {src.label}
            </a>
            {i < SOURCES.length - 1 ? ', ' : '.'}
          </span>
        ))}
      </p>
    </footer>
  );
};
