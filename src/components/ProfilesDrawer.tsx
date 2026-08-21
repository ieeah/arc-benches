import { useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { Drawer, type DrawerFrom } from '@/components/Drawer';
import { useAppStore } from '@/store';
import { useTranslation } from '@/i18n';

export function ProfilesDrawer({
  isOpen,
  onClose,
  from = 'bottom',
}: {
  isOpen: boolean;
  onClose: () => void;
  from?: DrawerFrom;
}) {
  const { t } = useTranslation();
  const profiles = useAppStore(s => s.profiles);
  const activeProfileId = useAppStore(s => s.activeProfileId);
  const switchProfile = useAppStore(s => s.switchProfile);
  const createProfile = useAppStore(s => s.createProfile);
  const renameProfile = useAppStore(s => s.renameProfile);
  const deleteProfile = useAppStore(s => s.deleteProfile);

  const [editingProfile, setEditingProfile] = useState<{ id: string; name: string } | null>(null);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setEditingProfile(null);
    setDeletingProfileId(null);
    setShowNewProfile(false);
    setNewProfileName('');
    onClose();
  };

  const commitNewProfile = () => {
    const name = newProfileName.trim();
    if (!name) return;
    createProfile(name);
    setShowNewProfile(false);
    setNewProfileName('');
    handleClose();
  };

  const commitRenameProfile = () => {
    if (!editingProfile) return;
    const name = editingProfile.name.trim();
    if (name) renameProfile(editingProfile.id, name);
    setEditingProfile(null);
  };

  return (
    <Drawer from={from} title={t('profiles.title')} onClose={handleClose}>
      <div className="space-y-1.5 pt-1">
        {profiles.map(profile => {
          const isActive = profile.id === activeProfileId;
          const isDeleting = deletingProfileId === profile.id;
          const isEditing = editingProfile?.id === profile.id;

          return (
            <div
              key={profile.id}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${
                isActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer ${
                  isActive ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                onClick={() => {
                  if (!isEditing && !isDeleting && !isActive) {
                    switchProfile(profile.id);
                    handleClose();
                  }
                }}
              >
                {isActive && <Check size={11} className="text-white" strokeWidth={3} />}
              </div>

              {isEditing ? (
                <input
                  autoFocus
                  className="flex-1 text-sm font-semibold bg-white dark:bg-gray-700 border border-blue-400 rounded-xl px-2 py-1 focus:outline-none"
                  value={editingProfile.name}
                  onChange={e => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRenameProfile();
                    if (e.key === 'Escape') setEditingProfile(null);
                  }}
                />
              ) : (
                <span
                  className={`flex-1 text-sm font-semibold truncate cursor-pointer ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : ''
                  }`}
                  onClick={() => {
                    if (!isDeleting && !isActive) {
                      switchProfile(profile.id);
                      handleClose();
                    }
                  }}
                >
                  {profile.name}
                </span>
              )}

              {isEditing ? (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={commitRenameProfile}
                    className="px-2.5 py-1 bg-blue-500 text-white text-xs font-bold rounded-full"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setEditingProfile(null)}
                    className="px-2.5 py-1 bg-gray-200 dark:bg-gray-700 text-xs rounded-full"
                  >
                    ✕
                  </button>
                </div>
              ) : isDeleting ? (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => {
                      deleteProfile(profile.id);
                      setDeletingProfileId(null);
                    }}
                    className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full"
                  >
                    {t('common.delete')}
                  </button>
                  <button
                    onClick={() => setDeletingProfileId(null)}
                    className="px-2.5 py-1 bg-gray-200 dark:bg-gray-700 text-xs rounded-full"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingProfile({ id: profile.id, name: profile.name });
                      setDeletingProfileId(null);
                    }}
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingProfileId(profile.id);
                      setEditingProfile(null);
                    }}
                    disabled={profiles.length <= 1}
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          {showNewProfile ? (
            <div className="flex gap-1.5">
              <input
                autoFocus
                className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 border border-blue-400 rounded-xl px-3 py-2 focus:outline-none"
                placeholder={t('profiles.namePlaceholder')}
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitNewProfile();
                  if (e.key === 'Escape') {
                    setShowNewProfile(false);
                    setNewProfileName('');
                  }
                }}
              />
              <button
                onClick={commitNewProfile}
                className="px-3 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl"
              >
                OK
              </button>
              <button
                onClick={() => {
                  setShowNewProfile(false);
                  setNewProfileName('');
                }}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-xs rounded-xl"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowNewProfile(true);
                setEditingProfile(null);
                setDeletingProfileId(null);
              }}
              className="w-full flex items-center gap-2 p-3 text-blue-500 font-bold text-sm rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Plus size={15} />
              {t('profiles.create')}
            </button>
          )}
        </div>
      </div>
    </Drawer>
  );
}
