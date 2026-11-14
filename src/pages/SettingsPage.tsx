import { useState, useCallback, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { SectionHeader } from '@/components/SectionHeader';
import { IconButton } from '@/components/IconButton';
import { useTranslation } from '@/i18n';
import { AppearanceConfigSection } from '@/components/settings/AppearanceConfigSection';
import { NavigationErgonomicsSection } from '@/components/settings/NavigationErgonomicsSection';
import { ProfilesManagerSection } from '@/components/settings/ProfilesManagerSection';
import { ProfileSectionsConfigSection } from '@/components/settings/ProfileSectionsConfigSection';
import { RewardPassConfigSection } from '@/components/pass/RewardPassConfigSection';
import { BackupPortabilitySection } from '@/components/settings/BackupPortabilitySection';
import { AppInfoSection } from '@/components/settings/AppInfoSection';

type SettingsPageProps = {
  onBack: () => void;
};

export const SettingsPage = ({ onBack }: SettingsPageProps) => {
  const { t } = useTranslation();
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFeedback = useCallback((msg: string) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedbackMsg(msg);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackMsg(null);
    }, 3000);
  }, []);

  return (
    <PageLayout
      headerSticky={true}
      headerSlot={
        <SectionHeader
          title={t('settings.title')}
          leading={
            <IconButton onClick={onBack} title={t('common.back')}>
              <ArrowLeft size={18} />
            </IconButton>
          }
        />
      }
    >
      <div className="space-y-6">
        {feedbackMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200 font-semibold animate-in fade-in">
            {feedbackMsg}
          </div>
        )}

        <AppearanceConfigSection onFeedback={handleFeedback} />
        <NavigationErgonomicsSection onFeedback={handleFeedback} />
        <ProfilesManagerSection onFeedback={handleFeedback} />
        <ProfileSectionsConfigSection />
        <RewardPassConfigSection />
        <BackupPortabilitySection />
        <AppInfoSection />
      </div>
    </PageLayout>
  );
};
