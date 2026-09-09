import React, { useState, useMemo } from "react";
import {
  Layers,
  Search,
  Plus,
  Trash2,
  Copy,
  Download,
  RotateCcw,
  Check,
  Package,
  CheckSquare,
  Gift,
  Pencil,
  FileJson,
  Compass,
  Wrench,
  FolderKanban,
  Scroll,
  Languages,
  X,
  Milestone,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import type {
  List,
  CheckboxAction,
  Reward,
  ListType,
  ItemInfo,
  TieredAction,
  ActionStep,
} from "@/types";
import { DevStudioLayout } from "@/components/DevStudioLayout";
import { ItemCardFrameV2 } from "@/components/ItemCardFrameV2";
import { ItemPicker } from "@/components/ItemPicker";
import { ItemQuantityModal } from "@/components/ItemQuantityModal";
import { ConfirmDeleteItemModal } from "@/components/ConfirmDeleteItemModal";
import { ConfirmActionModal } from "@/components/ConfirmActionModal";
import { IsoDateTimeField } from "@/components/IsoDateTimeField";
import { TieredActionTimeline } from "@/components/TieredActionTimeline";
import { useTranslation, getItemName, getListName } from "@/i18n";
import { validateExpeditionIndex } from "@/lib/validate";
import itemsDatabase from "@/data/items.json";
import { generateUUID } from "@/lib/uuid";
import { cn } from "@/lib/cn";
import { useDevListDrafts } from "@/hooks/dev/useDevListDrafts";
import { useDevListEditor } from "@/hooks/dev/useDevListEditor";
import { DevListCard } from "@/components/dev/DevListCard";
import { DevDamageChallengeSection } from "@/components/dev/DevDamageChallengeSection";

interface DevListsPageProps {
  onBack: () => void;
}

type FilterType = "all" | ListType;

const LIST_TYPES_ORDER: ListType[] = [
  "workbench",
  "expedition",
  "project",
  "quest",
  "custom",
];

const LIST_TYPE_CONFIG: Record<
  ListType,
  { label: string; icon: React.ReactNode; color: string; filename: string }
> = {
  workbench: {
    label: "Banchi da Lavoro",
    icon: <Wrench size={14} className="text-amber-500" />,
    color: "amber",
    filename: "workbenches.json",
  },
  expedition: {
    label: "Spedizioni",
    icon: <Compass size={14} className="text-blue-500" />,
    color: "blue",
    filename: "expeditions.json",
  },
  project: {
    label: "Progetti",
    icon: <FolderKanban size={14} className="text-purple-500" />,
    color: "purple",
    filename: "projects.json",
  },
  quest: {
    label: "Quest",
    icon: <Scroll size={14} className="text-emerald-500" />,
    color: "emerald",
    filename: "quests.json",
  },
  custom: {
    label: "Personalizzate",
    icon: <Layers size={14} className="text-gray-500" />,
    color: "gray",
    filename: "custom-lists.json",
  },
};



export function DevListsPage({ onBack }: DevListsPageProps) {
  const { language } = useTranslation();
  const itemsMap = useMemo(() => itemsDatabase as Record<string, ItemInfo>, []);

  const { listsData, setListsData, initialData, resetAllDrafts } = useDevListDrafts();



  // Selected State
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(() => {
    return listsData.workbench[0]?.id || listsData.expedition[0]?.id || null;
  });
  const [activeLevelNumber, setActiveLevelNumber] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const [previewTab, setPreviewTab] = useState<"single" | "file">("file");

  // Item Picker & Modal States (Reusing Custom List Modals)
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [itemToConfigure, setItemToConfigure] = useState<{
    item: ItemInfo;
    initialQty: number;
    editIndex?: number;
  } | null>(null);
  const [pendingPickerConfig, setPendingPickerConfig] = useState<{
    initialQty: number;
    editIndex?: number;
  } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{
    index: number;
    itemId: string;
    name: string;
    info?: ItemInfo;
  } | null>(null);
  const [editingAction, setEditingAction] = useState<{
    id: string;
    labelEn: string;
    labelIt: string;
  } | null>(null);
  const [editingReward, setEditingReward] = useState<{
    index: number;
    labelEn: string;
    labelIt: string;
  } | null>(null);
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [newActionEn, setNewActionEn] = useState("");
  const [newActionIt, setNewActionIt] = useState("");
  const [isAddingReward, setIsAddingReward] = useState(false);
  const [newRewardEn, setNewRewardEn] = useState("");
  const [newRewardIt, setNewRewardIt] = useState("");

  // Tiered Actions state
  const [editingTieredAction, setEditingTieredAction] = useState<{
    id: string;
    labelEn: string;
    labelIt: string;
    steps: Array<{ id: string; labelEn: string; labelIt: string }>;
  } | null>(null);
  const [isAddingTieredAction, setIsAddingTieredAction] = useState(false);
  const [newTieredEn, setNewTieredEn] = useState("");
  const [newTieredIt, setNewTieredIt] = useState("");
  const [newTieredSteps, setNewTieredSteps] = useState<
    Array<{ id: string; labelEn: string; labelIt: string }>
  >([]);

  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title?: string;
    message: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "primary";
    onConfirm: () => void;
  } | null>(null);

  // Flattened lists across buckets — listType è la fonte di verità, garantito dal JSON
  const allLists = useMemo(() => {
    const list: List[] = [];
    (Object.keys(listsData) as ListType[]).forEach((type) => {
      listsData[type].forEach((item) => {
        list.push({ ...item, listType: (item.listType || type) as ListType });
      });
    });
    return list;
  }, [listsData]);

  // Filtered lists for sidebar
  const filteredLists = useMemo(() => {
    return allLists.filter((l) => {
      const matchesFilter =
        activeFilter === "all" || l.listType === activeFilter;
      const localizedName = getListName(l, language);
      const matchesSearch =
        searchQuery.trim() === "" ||
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        localizedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [allLists, activeFilter, searchQuery, language]);

  // Collapsible category groups state
  const [collapsedTypes, setCollapsedTypes] = useState<Record<string, boolean>>({});

  const toggleTypeCollapse = (type: ListType) => {
    setCollapsedTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Grouped lists by listType for collapsible sections
  const groupedLists = useMemo(() => {
    const map = new Map<ListType, List[]>();
    LIST_TYPES_ORDER.forEach((t) => map.set(t, []));
    filteredLists.forEach((l) => {
      const key = l.listType as ListType;
      const arr = map.get(key);
      if (arr) {
        arr.push(l);
      } else {
        map.set(key, [l]);
      }
    });
    return map;
  }, [filteredLists]);

  const visibleGroups = useMemo(() => {
    return LIST_TYPES_ORDER.filter((type) => {
      const lists = groupedLists.get(type) || [];
      return lists.length > 0;
    });
  }, [groupedLists]);

  const {
    selectedList,
    updateSelectedList,
    handleCreateList,
    handleDuplicateList,
    handleDeleteList,
    handleResetCurrentList,
    handleResetCurrentLevel,
    handleAddLevel,
    handleRemoveLevel,
  } = useDevListEditor({
    listsData,
    setListsData,
    initialData,
    selectedListId,
    setSelectedListId,
    setActiveLevelNumber,
    setConfirmModalConfig,
  });

  // Active level within selected list
  const activeLevel = useMemo(() => {
    if (!selectedList) return null;
    return (
      selectedList.levels.find((lvl) => lvl.level === activeLevelNumber) ||
      selectedList.levels[0] ||
      null
    );
  }, [selectedList, activeLevelNumber]);

  // Validation for expedition index
  const expeditionIndexValidation = useMemo(() => {
    if (!selectedList || selectedList.listType !== "expedition")
      return null;
    return validateExpeditionIndex(
      selectedList.expeditionIndex ?? 0,
      selectedList.id,
      listsData.expedition || [],
    );
  }, [selectedList, listsData.expedition]);

  // Requirement Confirmation (Save quantity from ItemQuantityModal)
  const handleConfirmRequirementQuantity = (quantity: number) => {
    if (!selectedList || !activeLevel || !itemToConfigure) return;
    const { item, editIndex } = itemToConfigure;

    updateSelectedList((prev) => {
      const levels = prev.levels.map((lvl) => {
        if (lvl.level !== activeLevel.level) return lvl;
        const reqs = [...lvl.requirementItemIds];
        if (editIndex !== undefined) {
          reqs[editIndex] = { itemId: item.id, quantity };
        } else {
          const existingIdx = reqs.findIndex((r) => r.itemId === item.id);
          if (existingIdx >= 0) {
            reqs[existingIdx] = {
              itemId: item.id,
              quantity: reqs[existingIdx].quantity + quantity,
            };
          } else {
            reqs.push({ itemId: item.id, quantity });
          }
        }
        return { ...lvl, requirementItemIds: reqs };
      });
      return { ...prev, levels };
    });
    setItemToConfigure(null);
  };

  const handleConfirmRemoveRequirement = () => {
    if (!selectedList || !activeLevel || !itemToDelete) return;
    const { index } = itemToDelete;
    updateSelectedList((prev) => {
      const levels = prev.levels.map((lvl) => {
        if (lvl.level !== activeLevel.level) return lvl;
        return {
          ...lvl,
          requirementItemIds: lvl.requirementItemIds.filter(
            (_, i) => i !== index,
          ),
        };
      });
      return { ...prev, levels };
    });
    setItemToDelete(null);
  };

  // Add / Remove / Edit Action
  const handleStartAddAction = () => {
    setIsAddingAction(true);
    setNewActionEn("");
    setNewActionIt("");
  };

  const handleSaveNewAction = () => {
    if (!selectedList || !activeLevel) return;
    const cleanEn = newActionEn.trim();
    const cleanIt = newActionIt.trim();
    if (!cleanEn) {
      setIsAddingAction(false);
      setNewActionEn("");
      setNewActionIt("");
      return;
    }
    const newAction: CheckboxAction = {
      id: crypto.randomUUID(),
      label: cleanEn,
      ...(cleanIt ? { translations: { it: { label: cleanIt } } } : {}),
    };
    updateSelectedList((prev) => {
      const levels = prev.levels.map((lvl) => {
        if (lvl.level !== activeLevel.level) return lvl;
        return {
          ...lvl,
          actions: [...(lvl.actions || []), newAction],
        };
      });
      return { ...prev, levels };
    });
    setNewActionEn("");
    setNewActionIt("");
    setIsAddingAction(false);
  };

  const handleRemoveAction = (actionId: string) => {
    if (!selectedList || !activeLevel) return;
    updateSelectedList((prev) => {
      const levels = prev.levels.map((lvl) => {
        if (lvl.level !== activeLevel.level) return lvl;
        return {
          ...lvl,
          actions: (lvl.actions || []).filter((a) => a.id !== actionId),
        };
      });
      return { ...prev, levels };
    });
    if (editingAction?.id === actionId) {
      setEditingAction(null);
    }
  };

  const handleSaveEditedAction = () => {
    if (!selectedList || !activeLevel || !editingAction) return;
    const cleanEn = editingAction.labelEn.trim();
    const cleanIt = editingAction.labelIt.trim();
    if (!cleanEn) {
      setEditingAction(null);
      return;
    }
    updateSelectedList((prev) => {
      const levels = prev.levels.map((lvl) => {
        if (lvl.level !== activeLevel.level) return lvl;
        return {
          ...lvl,
          actions: (lvl.actions || []).map((a) => {
            if (a.id !== editingAction.id) return a;
            const updatedTr = { ...(a.translations || {}) };
            if (cleanIt) {
              updatedTr.it = { ...(updatedTr.it || {}), label: cleanIt };
            } else {
              delete updatedTr.it;
            }
            return {
              ...a,
              label: cleanEn,
              ...(Object.keys(updatedTr).length > 0
                ? { translations: updatedTr }
                : { translations: undefined }),
            };
          }),
        };
      });
      return { ...prev, levels };
    });
    setEditingAction(null);
  };

  // Add / Remove / Edit Reward
  const handleStartAddReward = () => {
    setIsAddingReward(true);
    setNewRewardEn("");
    setNewRewardIt("");
  };

  const handleSaveNewReward = () => {
    if (!selectedList || !activeLevel) return;
    const cleanEn = newRewardEn.trim();
    const cleanIt = newRewardIt.trim();
    if (!cleanEn) {
      setIsAddingReward(false);
      setNewRewardEn("");
      setNewRewardIt("");
      return;
    }
    const newReward: Reward = {
      label: cleanEn,
      ...(cleanIt ? { translations: { it: { label: cleanIt } } } : {}),
    };
    updateSelectedList((prev) => {
      const levels = prev.levels.map((lvl) => {
        if (lvl.level !== activeLevel.level) return lvl;
        return {
          ...lvl,
          rewards: [...(lvl.rewards || []), newReward],
        };
      });
      return { ...prev, levels };
    });
    setNewRewardEn("");
    setNewRewardIt("");
    setIsAddingReward(false);
  };

  const handleRemoveReward = (rewardIndex: number) => {
    if (!selectedList || !activeLevel) return;
    updateSelectedList((prev) => {
      const levels = prev.levels.map((lvl) => {
        if (lvl.level !== activeLevel.level) return lvl;
        return {
          ...lvl,
          rewards: (lvl.rewards || []).filter((_, i) => i !== rewardIndex),
        };
      });
      return { ...prev, levels };
    });
    if (editingReward?.index === rewardIndex) {
      setEditingReward(null);
    }
  };

  const handleSaveEditedReward = () => {
    if (!selectedList || !activeLevel || !editingReward) return;
    const cleanEn = editingReward.labelEn.trim();
    const cleanIt = editingReward.labelIt.trim();
    if (!cleanEn) {
      setEditingReward(null);
      return;
    }
    updateSelectedList((prev) => {
      const levels = prev.levels.map((lvl) => {
        if (lvl.level !== activeLevel.level) return lvl;
        return {
          ...lvl,
          rewards: (lvl.rewards || []).map((r, i) => {
            if (i !== editingReward.index) return r;
            const updatedTr = { ...(r.translations || {}) };
            if (cleanIt) {
              updatedTr.it = { ...(updatedTr.it || {}), label: cleanIt };
            } else {
              delete updatedTr.it;
            }
            return {
              ...r,
              label: cleanEn,
              ...(Object.keys(updatedTr).length > 0
                ? { translations: updatedTr }
                : { translations: undefined }),
            };
          }),
        };
      });
      return { ...prev, levels };
    });
    setEditingReward(null);
  };

  // Add / Remove / Edit Tiered Action
  const handleStartAddTieredAction = () => {
    setIsAddingTieredAction(true);
    setNewTieredEn("");
    setNewTieredIt("");
    setNewTieredSteps([
      { id: generateUUID(), labelEn: "Tier 1", labelIt: "Fase 1" },
      { id: generateUUID(), labelEn: "Tier 2", labelIt: "Fase 2" },
    ]);
  };

  const handleSaveNewTieredAction = () => {
    if (!selectedList || !activeLevel) return;
    const cleanEn = newTieredEn.trim();
    const cleanIt = newTieredIt.trim();
    if (!cleanEn) {
      setIsAddingTieredAction(false);
      setNewTieredEn("");
      setNewTieredIt("");
      setNewTieredSteps([]);
      return;
    }

    const validSteps: ActionStep[] = newTieredSteps
      .filter((s) => s.labelEn.trim() !== "")
      .map((s) => {
        const stepEn = s.labelEn.trim();
        const stepIt = s.labelIt.trim();
        return {
          id: s.id || generateUUID(),
          label: stepEn,
          ...(stepIt ? { translations: { it: { label: stepIt } } } : {}),
        };
      });

    if (validSteps.length === 0) {
      validSteps.push({
        id: generateUUID(),
        label: cleanEn,
        ...(cleanIt ? { translations: { it: { label: cleanIt } } } : {}),
      });
    }

    const newTieredAction: TieredAction = {
      id: generateUUID(),
      label: cleanEn,
      ...(cleanIt ? { translations: { it: { label: cleanIt } } } : {}),
      steps: validSteps,
    };

    updateSelectedList((prev) => {
      const levels = prev.levels.map((lvl) => {
        if (lvl.level !== activeLevel.level) return lvl;
        return {
          ...lvl,
          tieredActions: [...(lvl.tieredActions || []), newTieredAction],
        };
      });
      return { ...prev, levels };
    });

    setNewTieredEn("");
    setNewTieredIt("");
    setNewTieredSteps([]);
    setIsAddingTieredAction(false);
  };

  const handleRemoveTieredAction = (actionId: string) => {
    if (!selectedList || !activeLevel) return;
    updateSelectedList((prev) => {
      const levels = prev.levels.map((lvl) => {
        if (lvl.level !== activeLevel.level) return lvl;
        return {
          ...lvl,
          tieredActions: (lvl.tieredActions || []).filter(
            (a) => a.id !== actionId,
          ),
        };
      });
      return { ...prev, levels };
    });
    if (editingTieredAction?.id === actionId) {
      setEditingTieredAction(null);
    }
  };

  const handleSaveEditedTieredAction = () => {
    if (!selectedList || !activeLevel || !editingTieredAction) return;
    const cleanEn = editingTieredAction.labelEn.trim();
    const cleanIt = editingTieredAction.labelIt.trim();
    if (!cleanEn) {
      setEditingTieredAction(null);
      return;
    }

    const validSteps: ActionStep[] = editingTieredAction.steps
      .filter((s) => s.labelEn.trim() !== "")
      .map((s) => {
        const stepEn = s.labelEn.trim();
        const stepIt = s.labelIt.trim();
        return {
          id: s.id || generateUUID(),
          label: stepEn,
          ...(stepIt ? { translations: { it: { label: stepIt } } } : {}),
        };
      });

    if (validSteps.length === 0) {
      validSteps.push({
        id: generateUUID(),
        label: cleanEn,
        ...(cleanIt ? { translations: { it: { label: cleanIt } } } : {}),
      });
    }

    updateSelectedList((prev) => {
      const levels = prev.levels.map((lvl) => {
        if (lvl.level !== activeLevel.level) return lvl;
        return {
          ...lvl,
          tieredActions: (lvl.tieredActions || []).map((a) => {
            if (a.id !== editingTieredAction.id) return a;
            const updatedTr = { ...(a.translations || {}) };
            if (cleanIt) {
              updatedTr.it = { ...(updatedTr.it || {}), label: cleanIt };
            } else {
              delete updatedTr.it;
            }
            return {
              ...a,
              label: cleanEn,
              ...(Object.keys(updatedTr).length > 0
                ? { translations: updatedTr }
                : { translations: undefined }),
              steps: validSteps,
            };
          }),
        };
      });
      return { ...prev, levels };
    });
    setEditingTieredAction(null);
  };

  // JSON Preview Generator
  const currentCategory = (selectedList?.listType || "workbench") as ListType;
  const fileJsonContent = useMemo(() => {
    const items = listsData[currentCategory] || [];
    return JSON.stringify({ lists: items }, null, 2);
  }, [listsData, currentCategory]);

  const singleJsonContent = useMemo(() => {
    if (!selectedList) return "{}";
    return JSON.stringify(selectedList, null, 2);
  }, [selectedList]);

  const activeJsonToDisplay =
    previewTab === "file" ? fileJsonContent : singleJsonContent;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(activeJsonToDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const filename = LIST_TYPE_CONFIG[currentCategory].filename;
    const blob = new Blob([fileJsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetDraft = () => {
    setConfirmModalConfig({
      title: "Ripristina Tutte le Liste",
      message: "Ripristinare tutte le liste ai dati di default?",
      description:
        "Eventuali modifiche locali non esportate per tutti i banchi, le spedizioni e i progetti verranno cancellate.",
      confirmText: "Ripristina Tutto",
      variant: "warning",
      onConfirm: resetAllDrafts,
    });
  };

  return (
    <DevStudioLayout
      title="Gestione Liste Sviluppatore"
      subtitle="Editor per Workbench, Spedizioni, Progetti e Quest con supporto multilingua e anteprima JSON live"
      icon={<Layers size={20} className="text-purple-500" />}
      onBack={onBack}
      headerActions={
        <>
          <button
            type="button"
            onClick={handleResetDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
            title="Ripristina tutte le bozze ai file baseline"
          >
            <RotateCcw size={14} />
            <span>Reset Tutte le Bozze</span>
          </button>
          <button
            type="button"
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? "Copiato!" : "Copia JSON"}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadFile}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Download size={14} />
            <span>Scarica {LIST_TYPE_CONFIG[currentCategory].filename}</span>
          </button>
        </>
      }
      sidebar={
        <div className="flex flex-col h-full">
          {/* Filter Tabs */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {(
                [
                  "all",
                  "workbench",
                  "expedition",
                  "project",
                  "quest",
                ] as FilterType[]
              ).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer",
                    activeFilter === f
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
                  )}
                >
                  {f === "all" ? "Tutti" : LIST_TYPE_CONFIG[f].label}
                </button>
              ))}
            </div>

            {/* Search and Add */}
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Cerca lista…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCreateList(
                    activeFilter === "all" ? "project" : activeFilter,
                  )
                }
                className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                title="Crea nuova lista"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* List Items (Grouped by Category) */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {visibleGroups.length === 0 ? (
              <p className="p-4 text-xs text-center text-gray-400">
                Nessuna lista trovata.
              </p>
            ) : (
              visibleGroups.map((type) => {
                const config = LIST_TYPE_CONFIG[type];
                const listsInGroup = groupedLists.get(type) || [];
                const isCollapsed = Boolean(collapsedTypes[type]);
                const containsSelected = listsInGroup.some(
                  (l) => l.id === selectedListId,
                );

                return (
                  <div key={type} className="space-y-1">
                    {/* Collapsible Group Header */}
                    <button
                      type="button"
                      onClick={() => toggleTypeCollapse(type)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none",
                        isCollapsed
                          ? "bg-gray-50/80 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60",
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="shrink-0">{config.icon}</span>
                        <span className="truncate">{config.label}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-gray-200/70 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300">
                          {listsInGroup.length}
                        </span>
                        {containsSelected && isCollapsed && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0"
                            title="Contiene la lista selezionata"
                          />
                        )}
                      </div>
                      <ChevronDown
                        size={14}
                        className={cn(
                          "text-gray-400 transition-transform duration-200 shrink-0",
                          isCollapsed && "-rotate-90",
                        )}
                      />
                    </button>

                    {/* Group Items */}
                    {!isCollapsed && (
                      <div className="space-y-1 pl-1">
                        {listsInGroup.map((list) => (
                          <DevListCard
                            key={list.id}
                            list={list}
                            isSelected={list.id === selectedListId}
                            expeditionLists={listsData.expedition || []}
                            typeIcon={config.icon}
                            onSelect={() => {
                              setSelectedListId(list.id);
                              setActiveLevelNumber(1);
                            }}
                            onDuplicate={(e) => {
                              e.stopPropagation();
                              handleDuplicateList(list);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      }
      previewTitle="Anteprima JSON"
      previewIcon={<FileJson size={16} className="text-blue-400" />}
      previewBadge={
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setPreviewTab("file")}
            className={cn(
              "px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer",
              previewTab === "file"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-gray-200",
            )}
          >
            File ({LIST_TYPE_CONFIG[currentCategory].filename})
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab("single")}
            className={cn(
              "px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer",
              previewTab === "single"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-gray-200",
            )}
          >
            Singola
          </button>
        </div>
      }
      previewContent={
        <div className="h-full flex flex-col">
          <pre className="flex-1 p-4 text-[11px] font-mono leading-relaxed overflow-auto bg-gray-950 text-gray-300 select-all">
            {activeJsonToDisplay}
          </pre>
        </div>
      }
    >
      {/* Central Editor Area */}
      {!selectedList ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 space-y-3">
          <Layers size={40} className="text-gray-300 dark:text-gray-700" />
          <p className="text-sm font-medium">
            Seleziona una lista dalla sidebar o creane una nuova per iniziare
            l'editing.
          </p>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl">
          {/* Header Card with Metadata */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[24px] p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  {LIST_TYPE_CONFIG[selectedList.listType as ListType].icon}
                </span>
                <div>
                  <h2 className="text-base font-black text-gray-900 dark:text-gray-100">
                    {getListName(selectedList, language)}
                  </h2>
                  <span className="text-[11px] font-mono text-gray-400">
                    {selectedList.id}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    selectedList && handleDuplicateList(selectedList)
                  }
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
                  title="Duplica questa lista creando una copia modificabile"
                >
                  <Copy size={13} />
                  <span>Duplica</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetCurrentList}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
                  title="Ripristina questa lista ai valori originali"
                >
                  <RotateCcw size={13} />
                  <span>Ripristina</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleDeleteList(selectedList.id, selectedList.listType as ListType)
                  }
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                  title="Elimina lista"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Basic Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* ID */}
              <div>
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  ID Lista (Univoco)
                </label>
                <input
                  type="text"
                  value={selectedList.id}
                  onChange={(e) =>
                    updateSelectedList((prev) => ({
                      ...prev,
                      id: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-mono"
                />
              </div>

              {/* Tipologia */}
              <div>
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Tipologia (listType)
                </label>
                <select
                  value={selectedList.listType}
                  onChange={(e) => {
                    const newType = e.target.value as ListType;
                    updateSelectedList((prev) => ({
                      ...prev,
                      listType: newType,
                    }));
                  }}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold"
                >
                  <option value="workbench">Workbench (Banchi)</option>
                  <option value="expedition">
                    Expedition (Spedizioni / Prestigio)
                  </option>
                  <option value="project">Project (Progetti)</option>
                  <option value="quest">Quest (Missioni / Contratti)</option>
                </select>
              </div>

              {/* Multilingua: Nome EN / Default */}
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between mb-1">
                  <span>Nome Principale (EN / Default)</span>
                  <span className="text-[10px] font-mono text-gray-400">
                    en
                  </span>
                </label>
                <input
                  type="text"
                  value={selectedList.name}
                  onChange={(e) =>
                    updateSelectedList((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium"
                />
              </div>

              {/* Multilingua: Traduzione IT */}
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <Languages size={13} className="text-blue-500" />
                    Traduzione Nome (Italiano)
                  </span>
                  <span className="text-[10px] font-mono text-blue-500 font-bold">
                    it
                  </span>
                </label>
                <input
                  type="text"
                  placeholder={selectedList.name}
                  value={selectedList.translations?.it?.name || ""}
                  onChange={(e) =>
                    updateSelectedList((prev) => ({
                      ...prev,
                      translations: {
                        ...(prev.translations || {}),
                        it: {
                          ...(prev.translations?.it || {}),
                          name: e.target.value.trim()
                            ? e.target.value
                            : undefined,
                        },
                      },
                    }))
                  }
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium"
                />
              </div>

              {/* Multilingua: Descrizione EN */}
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Descrizione (EN / Default)
                </label>
                <textarea
                  rows={2}
                  value={selectedList.description || ""}
                  onChange={(e) =>
                    updateSelectedList((prev) => ({
                      ...prev,
                      description: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium resize-none"
                />
              </div>

              {/* Multilingua: Descrizione IT */}
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                  <Languages size={13} className="text-blue-500" />
                  Descrizione (Italiano)
                </label>
                <textarea
                  rows={2}
                  placeholder={selectedList.description || ""}
                  value={selectedList.translations?.it?.description || ""}
                  onChange={(e) =>
                    updateSelectedList((prev) => ({
                      ...prev,
                      translations: {
                        ...(prev.translations || {}),
                        it: {
                          ...(prev.translations?.it || {}),
                          description: e.target.value.trim()
                            ? e.target.value
                            : undefined,
                        },
                      },
                    }))
                  }
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium resize-none"
                />
              </div>

              {selectedList.listType === "expedition" && (
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                      Indice Spedizione (Progressivo: 1, 2, 3...)
                    </label>
                    {expeditionIndexValidation &&
                      !expeditionIndexValidation.isValid && (
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                          Indice non valido
                        </span>
                      )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={selectedList.expeditionIndex ?? ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      updateSelectedList((prev) => ({
                        ...prev,
                        expeditionIndex: isNaN(val) ? 0 : val,
                      }));
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border rounded-xl font-bold transition-colors",
                      expeditionIndexValidation &&
                        !expeditionIndexValidation.isValid
                        ? "border-red-500 dark:border-red-500 focus:ring-2 focus:ring-red-400 text-red-700 dark:text-red-300"
                        : "border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100",
                    )}
                  />
                  {expeditionIndexValidation &&
                    !expeditionIndexValidation.isValid && (
                      <div className="flex items-start gap-1.5 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <p className="font-medium text-[11px] leading-tight">
                          {expeditionIndexValidation.error}
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              <IsoDateTimeField
                label="Data Inizio Finestra (Apertura)"
                value={selectedList.startDate}
                onChange={(val) =>
                  updateSelectedList((prev) => ({ ...prev, startDate: val }))
                }
              />
              <IsoDateTimeField
                label="Data Scadenza / Partenza (Chiusura)"
                value={selectedList.expirationDate}
                onChange={(val) =>
                  updateSelectedList((prev) => ({
                    ...prev,
                    expirationDate: val,
                  }))
                }
              />
            </div>
          </div>

          {/* Level Tabs & Level Content */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[24px] p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {selectedList.levels.map((lvl) => (
                  <button
                    key={lvl.level}
                    type="button"
                    onClick={() => setActiveLevelNumber(lvl.level)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                      activeLevelNumber === lvl.level
                        ? "bg-purple-600 text-white shadow-xs scale-105"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
                    )}
                  >
                    Livello {lvl.level}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleAddLevel}
                  className="p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-gray-600 dark:text-gray-300 hover:text-purple-600 rounded-xl transition-colors cursor-pointer"
                  title="Aggiungi Livello"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResetCurrentLevel(activeLevelNumber)}
                  className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-purple-600 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer flex items-center gap-1"
                  title={`Ripristina il Livello ${activeLevelNumber} ai dati originali`}
                >
                  <RotateCcw size={12} />
                  <span>Ripristina Livello {activeLevelNumber}</span>
                </button>

                {selectedList.levels.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLevel(activeLevelNumber)}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    Elimina Livello {activeLevelNumber}
                  </button>
                )}
              </div>
            </div>

            {/* Level Content Editor */}
            {activeLevel && (
              <div className="space-y-6">
                {/* 1. Requirement Materials */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Package size={14} className="text-purple-500" />
                      Materiali Richiesti (
                      {activeLevel.requirementItemIds.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Aggiungi Materiale</span>
                    </button>
                  </div>

                  {activeLevel.requirementItemIds.length === 0 ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
                      Nessun materiale richiesto per questo livello.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeLevel.requirementItemIds.map((req, index) => {
                        const item = itemsMap[req.itemId];
                        const itemName = item
                          ? getItemName(item, language)
                          : req.itemId;
                        return (
                          <div
                            key={`${req.itemId}-${index}`}
                            className="p-2.5 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-between gap-3 group hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-10 h-10 shrink-0">
                                <ItemCardFrameV2
                                  icon={item?.icon}
                                  rarity={item?.rarity || "Common"}
                                  compact
                                  borderRadius={12}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                  {itemName}
                                </p>
                                <span className="text-[10px] font-mono text-gray-400">
                                  {req.itemId}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                                ×{req.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const baseInfo = item || {
                                    id: req.itemId,
                                    name: req.itemId,
                                    description: "",
                                    rarity: "Common",
                                    item_type: "Material",
                                    icon: null,
                                    subcategory: null,
                                    value: 0,
                                    workbench: null,
                                    loot_area: null,
                                    stack_size: null,
                                  };
                                  setItemToConfigure({
                                    item: baseInfo,
                                    initialQty: req.quantity,
                                    editIndex: index,
                                  });
                                }}
                                className="w-8 h-8 rounded-full bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                                title="Modifica quantità"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setItemToDelete({
                                    index,
                                    itemId: req.itemId,
                                    name: itemName,
                                    info: item,
                                  });
                                }}
                                className="w-8 h-8 rounded-full bg-red-50/80 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                                title="Rimuovi"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Requirement Actions (Checkbox Tasks) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare size={14} className="text-blue-500" />
                      Azioni / Obiettivi Task (
                      {activeLevel.actions?.length || 0})
                    </h3>
                    {!isAddingAction && (
                      <button
                        type="button"
                        onClick={handleStartAddAction}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Aggiungi Azione</span>
                      </button>
                    )}
                  </div>

                  {/* Inline Add Action Form */}
                  {isAddingAction && (
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-400 dark:border-blue-600 rounded-2xl space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                          <Plus size={13} />
                          Nuova Azione / Task
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleSaveNewAction}
                            disabled={!newActionEn.trim()}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Aggiungi"
                          >
                            <Check size={13} />
                            <span>Aggiungi</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingAction(false);
                              setNewActionEn("");
                              setNewActionIt("");
                            }}
                            className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center cursor-pointer"
                            title="Annulla"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 block mb-0.5">
                            Descrizione EN (Default)
                          </label>
                          <input
                            type="text"
                            autoFocus
                            value={newActionEn}
                            onChange={(e) => setNewActionEn(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveNewAction();
                              if (e.key === "Escape") {
                                setIsAddingAction(false);
                                setNewActionEn("");
                                setNewActionIt("");
                              }
                            }}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Deposit 100 Seeds"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-0.5">
                            <Languages size={11} className="text-blue-500" />
                            Traduzione Italiano (IT)
                          </label>
                          <input
                            type="text"
                            value={newActionIt}
                            onChange={(e) => setNewActionIt(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveNewAction();
                              if (e.key === "Escape") {
                                setIsAddingAction(false);
                                setNewActionEn("");
                                setNewActionIt("");
                              }
                            }}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            placeholder="es. Deposita 100 Semi"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {(!activeLevel.actions || activeLevel.actions.length === 0) &&
                  !isAddingAction ? (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
                      Nessuna azione richiesta per questo livello.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeLevel.actions?.map((action) => {
                        const isEditing = editingAction?.id === action.id;
                        if (isEditing) {
                          return (
                            <div
                              key={action.id}
                              className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700 rounded-2xl space-y-2.5 shadow-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                                  <Pencil size={12} />
                                  Modifica Azione ({action.id.slice(0, 8)}…)
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={handleSaveEditedAction}
                                    disabled={!editingAction.labelEn.trim()}
                                    className="px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                    title="Salva modifiche"
                                  >
                                    <Check size={13} />
                                    <span>Salva</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingAction(null)}
                                    className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center cursor-pointer"
                                    title="Annulla"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 block mb-0.5">
                                    Descrizione EN (Default)
                                  </label>
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editingAction.labelEn}
                                    onChange={(e) =>
                                      setEditingAction({
                                        ...editingAction,
                                        labelEn: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        handleSaveEditedAction();
                                      if (e.key === "Escape")
                                        setEditingAction(null);
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-0.5">
                                    <Languages
                                      size={11}
                                      className="text-blue-500"
                                    />
                                    Traduzione Italiano (IT)
                                  </label>
                                  <input
                                    type="text"
                                    value={editingAction.labelIt}
                                    placeholder={editingAction.labelEn}
                                    onChange={(e) =>
                                      setEditingAction({
                                        ...editingAction,
                                        labelIt: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        handleSaveEditedAction();
                                      if (e.key === "Escape")
                                        setEditingAction(null);
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={action.id}
                            className="p-2.5 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-800 dark:text-gray-200 font-medium truncate">
                                  {action.label}
                                </p>
                                {action.translations?.it?.label && (
                                  <p className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                                    <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                                      IT
                                    </span>
                                    <span className="truncate">
                                      {action.translations.it.label}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-mono text-gray-400">
                                {action.id.slice(0, 8)}…
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingAction({
                                    id: action.id,
                                    labelEn: action.label,
                                    labelIt:
                                      action.translations?.it?.label || "",
                                  })
                                }
                                className="w-7 h-7 rounded-full bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                                title="Modifica azione"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveAction(action.id)}
                                className="w-7 h-7 rounded-full bg-red-50/80 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                                title="Rimuovi azione"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Tiered Actions (Timeline / Multi-Step) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Milestone size={14} className="text-amber-500" />
                      Obiettivi a Scaglioni / Timeline (
                      {activeLevel.tieredActions?.length || 0})
                    </h3>
                    {!isAddingTieredAction && (
                      <button
                        type="button"
                        onClick={handleStartAddTieredAction}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Aggiungi Obiettivo a Scaglioni</span>
                      </button>
                    )}
                  </div>

                  {/* Inline Add Tiered Action Form */}
                  {isAddingTieredAction && (
                    <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-400 dark:border-amber-600 rounded-2xl space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                          <Plus size={13} />
                          Nuovo Obiettivo a Scaglioni (Multi-Step Timeline)
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleSaveNewTieredAction}
                            disabled={!newTieredEn.trim()}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Aggiungi"
                          >
                            <Check size={13} />
                            <span>Aggiungi</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingTieredAction(false);
                              setNewTieredEn("");
                              setNewTieredIt("");
                              setNewTieredSteps([]);
                            }}
                            className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center cursor-pointer"
                            title="Annulla"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Main Action Labels */}
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 block mb-0.5">
                            Nome Obiettivo EN (Default)
                          </label>
                          <input
                            type="text"
                            autoFocus
                            value={newTieredEn}
                            onChange={(e) => setNewTieredEn(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                            placeholder="es. Damage Challenge"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-0.5">
                            <Languages size={11} className="text-amber-500" />
                            Traduzione Italiano (IT)
                          </label>
                          <input
                            type="text"
                            value={newTieredIt}
                            onChange={(e) => setNewTieredIt(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                            placeholder="es. Sfida Danni"
                          />
                        </div>
                      </div>

                      {/* Steps Configuration */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                            Scaglioni / Step ({newTieredSteps.length})
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setNewTieredSteps((prev) => [
                                ...prev,
                                {
                                  id: generateUUID(),
                                  labelEn: `Tier ${prev.length + 1}`,
                                  labelIt: `Fase ${prev.length + 1}`,
                                },
                              ])
                            }
                            className="text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus size={11} />
                            Aggiungi Scaglione
                          </button>
                        </div>

                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {newTieredSteps.map((step, sIdx) => (
                            <div
                              key={step.id || sIdx}
                              className="p-2 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-center gap-2"
                            >
                              <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {sIdx + 1}
                              </span>
                              <div className="grid grid-cols-2 gap-2 flex-1">
                                <input
                                  type="text"
                                  value={step.labelEn}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewTieredSteps((prev) =>
                                      prev.map((s, i) =>
                                        i === sIdx ? { ...s, labelEn: val } : s,
                                      ),
                                    );
                                  }}
                                  placeholder="Soglia EN (es. 5,000)"
                                  className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                                />
                                <input
                                  type="text"
                                  value={step.labelIt}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewTieredSteps((prev) =>
                                      prev.map((s, i) =>
                                        i === sIdx ? { ...s, labelIt: val } : s,
                                      ),
                                    );
                                  }}
                                  placeholder="Soglia IT (es. 5.000)"
                                  className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setNewTieredSteps((prev) =>
                                    prev.filter((_, i) => i !== sIdx),
                                  )
                                }
                                disabled={newTieredSteps.length <= 1}
                                className="w-6 h-6 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30 flex items-center justify-center cursor-pointer shrink-0"
                                title="Rimuovi scaglione"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* List of Tiered Actions */}
                  {(!activeLevel.tieredActions ||
                    activeLevel.tieredActions.length === 0) &&
                  !isAddingTieredAction ? (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
                      Nessun obiettivo a scaglioni per questo livello.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeLevel.tieredActions?.map((tieredAction) => {
                        const isEditing =
                          editingTieredAction?.id === tieredAction.id;
                        if (isEditing) {
                          return (
                            <div
                              key={tieredAction.id}
                              className="p-3.5 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-2xl space-y-3 shadow-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                  <Pencil size={12} />
                                  Modifica Obiettivo a Scaglioni
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={handleSaveEditedTieredAction}
                                    disabled={
                                      !editingTieredAction.labelEn.trim()
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                    title="Salva modifiche"
                                  >
                                    <Check size={13} />
                                    <span>Salva</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingTieredAction(null)}
                                    className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center cursor-pointer"
                                    title="Annulla"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 block mb-0.5">
                                    Nome Obiettivo EN (Default)
                                  </label>
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editingTieredAction.labelEn}
                                    onChange={(e) =>
                                      setEditingTieredAction({
                                        ...editingTieredAction,
                                        labelEn: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-0.5">
                                    <Languages
                                      size={11}
                                      className="text-amber-500"
                                    />
                                    Traduzione Italiano (IT)
                                  </label>
                                  <input
                                    type="text"
                                    value={editingTieredAction.labelIt}
                                    onChange={(e) =>
                                      setEditingTieredAction({
                                        ...editingTieredAction,
                                        labelIt: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                                  />
                                </div>
                              </div>

                              {/* Steps Edit */}
                              <div className="space-y-2 pt-1">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                                    Scaglioni / Step (
                                    {editingTieredAction.steps.length})
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingTieredAction((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              steps: [
                                                ...prev.steps,
                                                {
                                                  id: generateUUID(),
                                                  labelEn: `Tier ${prev.steps.length + 1}`,
                                                  labelIt: `Fase ${prev.steps.length + 1}`,
                                                },
                                              ],
                                            }
                                          : null,
                                      )
                                    }
                                    className="text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <Plus size={11} />
                                    Aggiungi Scaglione
                                  </button>
                                </div>

                                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                  {editingTieredAction.steps.map(
                                    (step, sIdx) => (
                                      <div
                                        key={step.id || sIdx}
                                        className="p-2 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-center gap-2"
                                      >
                                        <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                          {sIdx + 1}
                                        </span>
                                        <div className="grid grid-cols-2 gap-2 flex-1">
                                          <input
                                            type="text"
                                            value={step.labelEn}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setEditingTieredAction((prev) =>
                                                prev
                                                  ? {
                                                      ...prev,
                                                      steps: prev.steps.map(
                                                        (s, i) =>
                                                          i === sIdx
                                                            ? {
                                                                ...s,
                                                                labelEn: val,
                                                              }
                                                            : s,
                                                      ),
                                                    }
                                                  : null,
                                              );
                                            }}
                                            placeholder="Soglia EN"
                                            className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                                          />
                                          <input
                                            type="text"
                                            value={step.labelIt}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setEditingTieredAction((prev) =>
                                                prev
                                                  ? {
                                                      ...prev,
                                                      steps: prev.steps.map(
                                                        (s, i) =>
                                                          i === sIdx
                                                            ? {
                                                                ...s,
                                                                labelIt: val,
                                                              }
                                                            : s,
                                                      ),
                                                    }
                                                  : null,
                                              );
                                            }}
                                            placeholder="Soglia IT"
                                            className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setEditingTieredAction((prev) =>
                                              prev
                                                ? {
                                                    ...prev,
                                                    steps: prev.steps.filter(
                                                      (_, i) => i !== sIdx,
                                                    ),
                                                  }
                                                : null,
                                            )
                                          }
                                          disabled={
                                            editingTieredAction.steps.length <=
                                            1
                                          }
                                          className="w-6 h-6 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30 flex items-center justify-center cursor-pointer shrink-0"
                                          title="Rimuovi scaglione"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={tieredAction.id}
                            className="p-3 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-2xl space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <Milestone
                                  size={15}
                                  className="text-amber-500 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                    {tieredAction.label}
                                  </p>
                                  {tieredAction.translations?.it?.label && (
                                    <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                                      <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                                        IT
                                      </span>
                                      <span className="truncate">
                                        {tieredAction.translations.it.label}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-mono text-gray-400">
                                  {tieredAction.id.slice(0, 8)}…
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingTieredAction({
                                      id: tieredAction.id,
                                      labelEn: tieredAction.label,
                                      labelIt:
                                        tieredAction.translations?.it?.label ||
                                        "",
                                      steps: tieredAction.steps.map((s) => ({
                                        id: s.id,
                                        labelEn: s.label,
                                        labelIt:
                                          s.translations?.it?.label || "",
                                      })),
                                    })
                                  }
                                  className="w-7 h-7 rounded-full bg-amber-50/80 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                                  title="Modifica obiettivo a scaglioni"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveTieredAction(tieredAction.id)
                                  }
                                  className="w-7 h-7 rounded-full bg-red-50/80 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                                  title="Rimuovi obiettivo a scaglioni"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Live Timeline Preview */}
                            <div className="pt-1 border-t border-gray-200/60 dark:border-gray-700/60">
                              <TieredActionTimeline
                                tieredAction={tieredAction}
                                listId={selectedList.id}
                                levelNum={activeLevel.level}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Level Rewards */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Gift size={14} className="text-emerald-500" />
                      Ricompense di Livello ({activeLevel.rewards?.length || 0})
                    </h3>
                    {!isAddingReward && (
                      <button
                        type="button"
                        onClick={handleStartAddReward}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Aggiungi Ricompensa</span>
                      </button>
                    )}
                  </div>

                  {/* Inline Add Reward Form */}
                  {isAddingReward && (
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-400 dark:border-emerald-600 rounded-2xl space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                          <Plus size={13} />
                          Nuova Ricompensa
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleSaveNewReward}
                            disabled={!newRewardEn.trim()}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Aggiungi"
                          >
                            <Check size={13} />
                            <span>Aggiungi</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingReward(false);
                              setNewRewardEn("");
                              setNewRewardIt("");
                            }}
                            className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center cursor-pointer"
                            title="Annulla"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 block mb-0.5">
                            Descrizione EN (Default)
                          </label>
                          <input
                            type="text"
                            autoFocus
                            value={newRewardEn}
                            onChange={(e) => setNewRewardEn(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveNewReward();
                              if (e.key === "Escape") {
                                setIsAddingReward(false);
                                setNewRewardEn("");
                                setNewRewardIt("");
                              }
                            }}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g. +1 Skill Point, +150 Coins"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-0.5">
                            <Languages size={11} className="text-emerald-500" />
                            Traduzione Italiano (IT)
                          </label>
                          <input
                            type="text"
                            value={newRewardIt}
                            onChange={(e) => setNewRewardIt(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveNewReward();
                              if (e.key === "Escape") {
                                setIsAddingReward(false);
                                setNewRewardEn("");
                                setNewRewardIt("");
                              }
                            }}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                            placeholder="es. +1 Punto Abilità, +150 Monete"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {(!activeLevel.rewards || activeLevel.rewards.length === 0) &&
                  !isAddingReward ? (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
                      Nessuna ricompensa associata a questo livello.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeLevel.rewards?.map((reward, rIndex) => {
                        const isEditing = editingReward?.index === rIndex;
                        if (isEditing) {
                          return (
                            <div
                              key={rIndex}
                              className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 rounded-2xl space-y-2.5 shadow-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                                  <Pencil size={12} />
                                  Modifica Ricompensa #{rIndex + 1}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={handleSaveEditedReward}
                                    disabled={!editingReward.labelEn.trim()}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                    title="Salva"
                                  >
                                    <Check size={13} />
                                    <span>Salva</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingReward(null)}
                                    className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center cursor-pointer"
                                    title="Annulla"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 block mb-0.5">
                                    Descrizione EN (Default)
                                  </label>
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editingReward.labelEn}
                                    onChange={(e) =>
                                      setEditingReward({
                                        ...editingReward,
                                        labelEn: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        handleSaveEditedReward();
                                      if (e.key === "Escape")
                                        setEditingReward(null);
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-0.5">
                                    <Languages
                                      size={11}
                                      className="text-emerald-500"
                                    />
                                    Traduzione Italiano (IT)
                                  </label>
                                  <input
                                    type="text"
                                    value={editingReward.labelIt}
                                    placeholder={editingReward.labelEn}
                                    onChange={(e) =>
                                      setEditingReward({
                                        ...editingReward,
                                        labelIt: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        handleSaveEditedReward();
                                      if (e.key === "Escape")
                                        setEditingReward(null);
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={rIndex}
                            className="p-2.5 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <Gift
                                size={14}
                                className="text-emerald-500 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-800 dark:text-gray-200 font-bold truncate">
                                  {reward.label}
                                </p>
                                {reward.translations?.it?.label && (
                                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                    <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                                      IT
                                    </span>
                                    <span className="truncate">
                                      {reward.translations.it.label}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingReward({
                                    index: rIndex,
                                    labelEn: reward.label,
                                    labelIt:
                                      reward.translations?.it?.label || "",
                                  })
                                }
                                className="w-7 h-7 rounded-full bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                                title="Modifica ricompensa"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveReward(rIndex)}
                                className="w-7 h-7 rounded-full bg-red-50/80 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                                title="Rimuovi ricompensa"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Expedition-Specific: Damage Challenge Configuration */}
          {selectedList.listType === "expedition" && (
            <DevDamageChallengeSection
              selectedList={selectedList}
              updateSelectedList={updateSelectedList}
            />
          )}
        </div>
      )}

      {/* Item Picker (Standard bottom sheet modal across the app) */}
      {isPickerOpen && (
        <ItemPicker
          excludeIds={activeLevel?.requirementItemIds.map((r) => r.itemId)}
          onPick={(item) => {
            setIsPickerOpen(false);
            const existingReq = activeLevel?.requirementItemIds.find(
              (r) => r.itemId === item.id,
            );
            const initialQty =
              pendingPickerConfig?.initialQty ?? existingReq?.quantity ?? 1;
            const editIndex = pendingPickerConfig?.editIndex;
            setItemToConfigure({
              item,
              initialQty,
              editIndex,
            });
            setPendingPickerConfig(null);
          }}
          onClose={() => {
            setIsPickerOpen(false);
            setPendingPickerConfig(null);
          }}
        />
      )}

      {/* Item Quantity Modal (Shared with Custom Lists) */}
      {itemToConfigure !== null && (
        <ItemQuantityModal
          item={itemToConfigure.item}
          initialQuantity={itemToConfigure.initialQty}
          onChangeItem={(currentQty) => {
            setPendingPickerConfig({
              initialQty: currentQty,
              editIndex: itemToConfigure.editIndex,
            });
            setItemToConfigure(null);
            setIsPickerOpen(true);
          }}
          onConfirm={handleConfirmRequirementQuantity}
          onClose={() => {
            setItemToConfigure(null);
            setPendingPickerConfig(null);
          }}
        />
      )}

      {/* Confirm Delete Item Modal (Shared with Custom Lists) */}
      {itemToDelete !== null && (
        <ConfirmDeleteItemModal
          itemName={itemToDelete.name}
          itemId={itemToDelete.itemId}
          itemInfo={itemToDelete.info}
          levelNum={activeLevelNumber}
          onConfirm={handleConfirmRemoveRequirement}
          onClose={() => setItemToDelete(null)}
        />
      )}

      {/* Generic Action Confirm Modal */}
      {confirmModalConfig !== null && (
        <ConfirmActionModal
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          description={confirmModalConfig.description}
          confirmText={confirmModalConfig.confirmText}
          cancelText={confirmModalConfig.cancelText}
          variant={confirmModalConfig.variant}
          onConfirm={confirmModalConfig.onConfirm}
          onClose={() => setConfirmModalConfig(null)}
        />
      )}
    </DevStudioLayout>
  );
}
